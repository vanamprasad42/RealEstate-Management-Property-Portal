import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <span className="text-xl font-bold text-primary">RealEstate</span>
          <p className="text-gray-400 text-sm mt-1">Your dream home awaits.</p>
        </div>
        <div className="text-sm text-gray-400 flex items-center gap-1">
          &copy; {new Date().getFullYear()} RealEstate. Made with <Heart size={16} className="text-red-500 inline" /> by Antigravity.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
