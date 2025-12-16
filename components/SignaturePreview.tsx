import React, { forwardRef } from 'react';
import { UserData } from '../types';
import { EmailIcon, PhoneIcon } from './Icons';

interface SignaturePreviewProps {
  data: UserData;
  bannerUrl: string | null;
  bannerConfig?: { x: number; y: number; scale: number };
  onPhotoMouseDown?: (e: React.MouseEvent) => void;
  onBannerMouseDown?: (e: React.MouseEvent) => void;
  isAdmin?: boolean;
}

const SignaturePreview = forwardRef<HTMLDivElement, SignaturePreviewProps>(({ 
  data, 
  bannerUrl, 
  bannerConfig = { x: 0, y: 0, scale: 1 }, 
  onPhotoMouseDown, 
  onBannerMouseDown,
  isAdmin 
}, ref) => {
  return (
    <div 
      ref={ref}
      style={{ width: '620px', height: '250px' }}
      className="bg-white relative flex overflow-hidden shadow-xl select-none"
    >
      {/* Background/Banner Layer (Absolute Full Size) 
          Occupies the entire container (inset-0). 
          z-0 ensures it stays behind the text.
      */}
      <div 
        className={`absolute inset-0 w-full h-full overflow-hidden z-0 ${isAdmin && bannerUrl ? 'cursor-move' : ''}`}
        onMouseDown={isAdmin ? onBannerMouseDown : undefined}
        title={isAdmin ? "Admin: Clique e arraste para ajustar o banner" : ""}
      >
            {bannerUrl ? (
               <img 
                 src={bannerUrl} 
                 alt="Campaign Banner" 
                 className="absolute max-w-none origin-center"
                 style={{
                    top: '50%',
                    left: '50%',
                    // Removed minWidth/minHeight to allow total freedom of movement
                    width: 'auto',
                    height: 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    // Note: objectFit is not relevant without fixed width/height but keeping code clean
                    transform: `translate(-50%, -50%) translate(${bannerConfig.x}px, ${bannerConfig.y}px) scale(${bannerConfig.scale})`,
                    pointerEvents: 'none',
                    userSelect: 'none'
                 }}
                 draggable={false}
               />
            ) : (
               <div className="w-full h-full"></div>
            )}
      </div>

      {/* Foreground Layer: Photo and Info (z-10) */}
      <div className="flex-1 flex items-center pl-8 z-10 relative pointer-events-none w-full h-full">
        {/* Pointer events none on container so clicks pass through to the banner layer in empty spaces */}
        
        {/* Photo Area */}
        <div 
            className="relative mr-5 shrink-0 w-[150px] h-[150px] rounded-full border-4 border-[#401669] bg-gray-200 overflow-hidden shadow-sm group pointer-events-auto cursor-move"
            onMouseDown={onPhotoMouseDown}
            title="Clique e arraste para ajustar a foto"
        >
            {data.photoUrl ? (
              <div className="w-full h-full relative overflow-hidden rounded-full">
                  <img 
                    src={data.photoUrl} 
                    alt="User"
                    className="absolute max-w-none"
                    style={{
                        top: '50%',
                        left: '50%',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `translate(-50%, -50%) translate(${data.photoX}px, ${data.photoY}px) scale(${data.photoScale})`,
                        pointerEvents: 'none'
                    }}
                  />
                  {/* Visual hint for interaction on hover */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20"/></svg>
                  </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                FOTO
              </div>
            )}
        </div>

        {/* Text Info - Changed to pointer-events-none so clicks pass through to banner */}
        <div className="flex flex-col justify-center min-w-[240px] pointer-events-none">
            {/* Name */}
            <h1 className="font-bold text-[#000000] tracking-tight" style={{ fontSize: '28px', lineHeight: '1.1', marginBottom: '4px' }}>
                {data.name || 'Nome Sobrenome'}
            </h1>
            
            {/* Role */}
            <h2 className="text-gray-500 font-normal" style={{ fontSize: '20px', lineHeight: '1.2' }}>
                {data.role || 'Cargo'}
            </h2>

            {/* Separator Line */}
            <div className="w-full border-t border-dashed border-gray-400 my-3"></div>

            {/* Contact Info */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-5 text-[#A855F7] flex justify-center"><PhoneIcon /></div>
                    <span className="text-black font-normal leading-none" style={{ fontSize: '15px' }}>
                        {data.phone || '11 99999-9999'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 text-[#A855F7] flex justify-center"><EmailIcon /></div>
                    <span className="text-black font-normal leading-none" style={{ fontSize: '15px' }}>
                        {data.email || 'email@metarh.com.br'}
                    </span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
});

SignaturePreview.displayName = "SignaturePreview";
export default SignaturePreview;