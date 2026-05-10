import React from 'react';
import { getImageUrl } from '../../utils/format';

const PLACEHOLDER_IMAGE = 'https://placehold.co/900x1200?text=No+Image';

export default function ProductGallery({ images, selectedImage, onSelectImage, badge }) {
  const galleryImages = Array.isArray(images) && images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const activeImage = selectedImage || galleryImages[0];

  return (
    <div className="flex gap-4">
      {/* Thumbnails */}
      <div className="hidden lg:flex flex-col gap-3 shrink-0">
        {galleryImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => onSelectImage(img)}
            className={`w-[72px] h-[88px] border-2 transition-all overflow-hidden ${
              activeImage === img ? 'border-lumiere-terracotta' : 'border-transparent hover:border-lumiere-gray/30'
            }`}
          >
            <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="relative flex-1 aspect-[3/4] bg-lumiere-blush overflow-hidden group">
        <img 
          src={getImageUrl(activeImage)} 
          alt="Product main" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        {badge && (
          <div className="absolute top-5 left-5 bg-lumiere-terracotta text-white text-[10px] tracking-[0.15em] uppercase font-medium px-2.5 py-1">
            {badge}
          </div>
        )}
        <button className="absolute bottom-5 right-5 w-10 h-10 bg-lumiere-cream/90 flex items-center justify-center text-xl hover:bg-lumiere-cream transition-colors">
          ⊕
        </button>
      </div>
    </div>
  );
}
