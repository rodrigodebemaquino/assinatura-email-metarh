import React, { forwardRef } from 'react';
import { UserData } from '../types';
import { WebsiteIcon, PhoneIcon } from './Icons';

interface SignaturePreviewProps {
  data: UserData;
  onPhotoMouseDown?: (e: React.MouseEvent) => void;
  showBanner?: boolean; // Controla se o banner deve ser exibido
}

const SignaturePreview = forwardRef<HTMLDivElement, SignaturePreviewProps>(({
  data,
  onPhotoMouseDown,
  showBanner = true, // Por padrão mostra o banner
}, ref) => {
  const BANNER_URL = "https://metarh.com.br/wp-content/uploads/assinaturas/Banner-assinatura.png";
  const [bannerSrc, setBannerSrc] = React.useState<string>(BANNER_URL);

  // Carregar banner como base64 para evitar CORS
  React.useEffect(() => {
    if (!showBanner) return;

    const loadBanner = async () => {
      try {
        const response = await fetch(BANNER_URL);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setBannerSrc(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.warn('Erro ao carregar banner:', error);
        // Mantém URL original como fallback
      }
    };

    loadBanner();
  }, [showBanner]);

  return (
    <div
      ref={ref}
      style={{ width: '620px', height: '250px' }}
      className="bg-white relative flex overflow-hidden shadow-xl select-none"
    >
      {/* Background/Banner Layer (Absolute Full Size) */}
      {showBanner && (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          {/* Banner na lateral direita */}
          <img
            src={bannerSrc}
            alt="Campaign Banner"
            className="absolute right-0 h-full w-auto object-cover pointer-events-none"
          />
        </div>
      )}

      {/* Foreground Layer: Photo and Info (z-10) */}
      {/* Moved content 20px to the right again (pl-3 -> pl-8) */}
      <div className="flex-1 flex items-center pl-8 z-10 relative pointer-events-none w-full h-full">

        {/* Photo Area */}
        {/* Reduced size by 10% (from 150px to 135px) */}
        <div
          className="relative mr-5 shrink-0 w-[135px] h-[135px] rounded-full border-4 border-[#401669] bg-gray-200 overflow-hidden shadow-sm group pointer-events-auto cursor-move"
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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20" /></svg>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
              FOTO
            </div>
          )}
        </div>

        {/* Text Info */}
        <div className="flex flex-col justify-center min-w-[240px] pointer-events-none">
          {/* Name - 18pt */}
          <h1 className="font-bold text-[#000000] tracking-tight" style={{ fontSize: '18pt', lineHeight: '1.1', marginBottom: '4px' }}>
            {data.name || 'Nome Sobrenome'}
          </h1>

          {/* Role - 14pt */}
          <h2 className="text-gray-500 font-normal" style={{ fontSize: '14pt', lineHeight: '1.2' }}>
            {data.role || 'Cargo / Setor'}
          </h2>

          {/* Separator Line */}
          <div className="w-full border-t border-dashed border-gray-400 my-3"></div>

          {/* Contact Info - Telefone 12pt, Website 10pt */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 text-[#A855F7] flex justify-center"><PhoneIcon /></div>
              <span className="text-black font-normal leading-none" style={{ fontSize: '12pt' }}>
                {data.phone || '11 99999-9999'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 text-[#A855F7] flex justify-center"><WebsiteIcon /></div>
              <span className="text-black font-normal leading-none" style={{ fontSize: '10pt' }}>
                {data.website || 'www.metarh.com.br'}
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