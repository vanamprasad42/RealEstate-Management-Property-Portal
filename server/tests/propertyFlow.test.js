import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Property from '../models/propertyModel.js';
import { approveProperty } from '../controllers/adminController.js';
import { optionalProtect } from '../middleware/authMiddleware.js';
import {
  createProperty,
  getProperties,
  invalidatePropertiesCache,
  updateProperty,
} from '../controllers/propertyController.js';
import {
  extractSearchFilters,
  fetchMatchingProperties,
  generateDomainAiResponse,
  isPropertyRelatedQuery,
  resolveConversationSearch,
} from '../services/aiService.js';

const properties = [];
const vendorId = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();
const originalMethods = {
  save: Property.prototype.save,
  findById: Property.findById,
  countDocuments: Property.countDocuments,
  find: Property.find,
  userFindById: User.findById,
};

const matchesQuery = (property, query) => Object.entries(query).every(([key, value]) => {
  if (key === '$or') {
    return value.some((condition) => Object.entries(condition).some(([field, expression]) => (
      String(property[field]).toLowerCase().includes(expression.$regex.toLowerCase())
    )));
  }

  return String(property[key]) === String(value);
});

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  headers: {},
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  setHeader(name, value) {
    this.headers[name] = value;
  },
});

before(() => {
  Property.prototype.save = async function save() {
    await this.validate();
    const index = properties.findIndex((property) => property._id.equals(this._id));
    if (index === -1) {
      properties.push(this);
    } else {
      properties[index] = this;
    }
    return this;
  };

  Property.findById = async (id) => properties.find((property) => property._id.toString() === id.toString()) || null;
  Property.countDocuments = async (query) => properties.filter((property) => matchesQuery(property, query)).length;
  Property.find = (query) => {
    let result = properties.filter((property) => matchesQuery(property, query));
    const queryBuilder = {
      populate() { return this; },
      sort() { return this; },
      limit(value) { result = result.slice(0, value); return this; },
      skip(value) { result = result.slice(value); return this; },
      lean() { return this; },
      then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
    };
    return queryBuilder;
  };
});

after(() => {
  Property.prototype.save = originalMethods.save;
  Property.findById = originalMethods.findById;
  Property.countDocuments = originalMethods.countDocuments;
  Property.find = originalMethods.find;
  User.findById = originalMethods.userFindById;
});

beforeEach(() => {
  properties.length = 0;
  invalidatePropertiesCache();
});

const validProperty = {
  title: 'Test Plot',
  description: 'A test property for lifecycle checks',
  price: 120000,
  propertyType: 'Plot',
  listingType: 'sale',
  city: 'Test City',
  state: 'Test State',
  address: '1 Test Road',
  area: 200,
  cornerPlot: 'No',
};

test('vendor create and edit normalizes cornerPlot and remains pending until admin approval', async () => {
  const createResponseObject = createResponse();
  await createProperty({
    body: validProperty,
    user: { _id: vendorId, role: 'vendor' },
  }, createResponseObject);

  assert.equal(createResponseObject.statusCode, 201);
  const property = createResponseObject.body;
  assert.equal(property.cornerPlot, false);
  assert.equal(property.approved, false);

  const updateResponseObject = createResponse();
  await updateProperty({
    params: { id: property._id.toString() },
    body: { cornerPlot: 'Yes', price: 130000 },
    user: { _id: vendorId, role: 'vendor' },
  }, updateResponseObject);

  assert.equal(updateResponseObject.statusCode, 200);
  assert.equal(updateResponseObject.body.cornerPlot, true);
  assert.equal(updateResponseObject.body.approved, false);

  const publicResponse = createResponse();
  await getProperties({ query: { keyword: 'Test Plot' } }, publicResponse);
  assert.equal(publicResponse.statusCode, 200);
  assert.equal(publicResponse.body.total, 0);

  const adminPendingResponse = createResponse();
  await getProperties({
    query: { approved: 'false' },
    user: { _id: adminId, role: 'admin' },
  }, adminPendingResponse);
  assert.equal(adminPendingResponse.statusCode, 200);
  assert.equal(adminPendingResponse.body.total, 1);

  const pendingResponse = createResponse();
  await getProperties({ query: { approved: 'false' } }, pendingResponse);
  assert.equal(pendingResponse.statusCode, 403);

  const approvalResponse = createResponse();
  await approveProperty({
    params: { id: property._id.toString() },
    body: { approved: true },
  }, approvalResponse);
  assert.equal(approvalResponse.statusCode, 200);
  assert.equal(approvalResponse.body.approved, true);

  const publishedResponse = createResponse();
  await getProperties({ query: { keyword: 'Test Plot' } }, publishedResponse);
  assert.equal(publishedResponse.statusCode, 200);
  assert.equal(publishedResponse.body.total, 1);
  assert.equal(publishedResponse.body.properties[0]._id.toString(), property._id.toString());
});

test('rejects invalid cornerPlot strings with a client validation response', async () => {
  const response = createResponse();
  await createProperty({
    body: { ...validProperty, cornerPlot: 'sometimes' },
    user: { _id: vendorId, role: 'vendor' },
  }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /cornerPlot must be a boolean/i);
  assert.equal(properties.length, 0);
});

test('restricts pending/all and vendor inventory queries and does not cache approved=all', async () => {
  const anonymousPendingResponse = createResponse();
  await getProperties({ query: { approved: 'false' } }, anonymousPendingResponse);
  assert.equal(anonymousPendingResponse.statusCode, 403);

  const anonymousAllResponse = createResponse();
  await getProperties({ query: { approved: 'all' } }, anonymousAllResponse);
  assert.equal(anonymousAllResponse.statusCode, 403);

  const otherVendorResponse = createResponse();
  await getProperties({
    query: { vendorId: vendorId.toString() },
    user: { _id: adminId, role: 'vendor' },
  }, otherVendorResponse);
  assert.equal(otherVendorResponse.statusCode, 403);

  const adminAllResponse = createResponse();
  await getProperties({
    query: { approved: 'all', pageSize: '6' },
    user: { _id: adminId, role: 'admin' },
  }, adminAllResponse);
  assert.equal(adminAllResponse.statusCode, 200);
  assert.equal(adminAllResponse.headers['Cache-Control'], undefined);

  const ownerResponse = createResponse();
  await getProperties({
    query: { vendorId: vendorId.toString() },
    user: { _id: vendorId, role: 'vendor' },
  }, ownerResponse);
  assert.equal(ownerResponse.statusCode, 200);
});

test('expired optional credentials do not block public property browsing', async () => {
  const response = createResponse();
  let continued = false;

  await optionalProtect({
    headers: { authorization: 'Bearer expired-token' },
  }, response, () => {
    continued = true;
  });

  assert.equal(continued, true);
  assert.equal(response.statusCode, 200);
});

test('AI assistant recognizes property queries with spelling mistakes and short city names', () => {
  const query = 'Green Park Apartmen hyd';
  assert.equal(isPropertyRelatedQuery(query), true);

  const filters = extractSearchFilters(query);
  assert.equal(filters.city, 'Hyderabad');
  assert.equal(filters.targetPropertyName, 'green park apartments');
});

test('AI assistant does not mistake generic property searches for named listings', () => {
  const filters = extractSearchFilters('Show more similar properties');
  assert.equal(filters.targetPropertyName, undefined);
});

test('AI related-property follow-ups reuse the previous search and exclude shown listings', () => {
  const result = resolveConversationSearch({
    message: 'Show more similar properties',
    conversationHistory: [
      { sender: 'user', text: 'Find 3 BHK properties in Hyderabad under 80 lakhs' },
      { sender: 'assistant', properties: ['507f1f77bcf86cd799439011'] }
    ],
    userPreferences: {
      preferredLocation: 'Mumbai',
      propertyType: '2 BHK',
      budget: 'Up to ₹50 Lakhs'
    }
  });

  assert.equal(result.isPropertyQuery, true);
  assert.equal(result.filters.city, 'Hyderabad');
  assert.equal(result.filters.bedrooms, 3);
  assert.equal(result.filters.maxPrice, 8000000);
  assert.equal(result.filters.relatedOnly, true);
  assert.deepEqual(result.filters.excludePropertyIds, ['507f1f77bcf86cd799439011']);
});

test('AI related-property searches apply inherited criteria and exclude prior results in MongoDB', async () => {
  const resolved = resolveConversationSearch({
    message: 'Show more similar properties',
    conversationHistory: [
      { sender: 'user', text: 'Find 3 BHK properties in Hyderabad under 80 lakhs' },
      { sender: 'assistant', properties: ['507f1f77bcf86cd799439011'] }
    ]
  });
  const originalFind = Property.find;
  const originalReadyState = Property.db.readyState;
  const queries = [];

  Property.db.readyState = 1;
  Property.find = (query) => {
    queries.push(query);
    const queryBuilder = {
      populate() { return this; },
      sort() { return this; },
      limit() { return this; },
      then(resolve, reject) { return Promise.resolve([]).then(resolve, reject); },
    };
    return queryBuilder;
  };

  try {
    await fetchMatchingProperties(resolved.filters);
  } finally {
    Property.find = originalFind;
    Property.db.readyState = originalReadyState;
  }

  assert.equal(queries[0].city.$regex.test('Hyderabad'), true);
  assert.equal(queries[0].bedrooms, 3);
  assert.equal(queries[0].price.$lte, 8000000);
  assert.deepEqual(queries[0]._id.$nin, ['507f1f77bcf86cd799439011']);
});

test('AI related-property follow-ups allow new search criteria to override the prior search', () => {
  const result = resolveConversationSearch({
    message: 'Find another 2 BHK in Mumbai',
    conversationHistory: [
      { sender: 'user', text: 'Find 3 BHK properties in Hyderabad under 80 lakhs' }
    ]
  });

  assert.equal(result.filters.city, 'Mumbai');
  assert.equal(result.filters.bedrooms, 2);
});

test('AI loan follow-ups do not turn into related-property searches', () => {
  const result = resolveConversationSearch({
    message: 'Tell me more about home loan options',
    conversationHistory: [
      { sender: 'user', text: 'Find 3 BHK properties in Hyderabad under 80 lakhs' }
    ]
  });

  assert.equal(result.isPropertyQuery, true);
  assert.equal(result.filters.relatedOnly, undefined);
});

test('AI related-property response does not claim listings exist when none matched', () => {
  const response = generateDomainAiResponse('Show more similar properties', [], { relatedOnly: true });

  assert.match(response.reply, /additional verified properties/i);
  assert.doesNotMatch(response.reply, /pulled our top verified listings/i);
});

test('AI assistant rejects unrelated requests before calling an external model', () => {
  assert.equal(isPropertyRelatedQuery('What is the capital of France?'), false);
  assert.equal(isPropertyRelatedQuery('Write a Python sorting function'), false);
  assert.equal(isPropertyRelatedQuery('Tell me a joke'), false);
});
