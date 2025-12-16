import React, { useState, useRef, useEffect } from 'react';
import { toBlob } from 'html-to-image';
import { DEFAULT_USER_DATA, UserData } from './types';
import SignaturePreview from './components/SignaturePreview';

// Define Banner Config Type
interface BannerConfig {
  url: string | null;
  x: number;
  y: number;
  scale: number;
}

const DEFAULT_BANNER_CONFIG: BannerConfig = {
  url: null,
  x: 0,
  y: 0,
  scale: 1,
};

function App() {
  // State
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Banner state
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(DEFAULT_BANNER_CONFIG);
  const [tempBannerUrl, setTempBannerUrl] = useState<string | null>(null);
  
  // Drag state
  const [dragTarget, setDragTarget] = useState<'photo' | 'banner' | null>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const signatureRef = useRef<HTMLDivElement>(null);

  // Load banner from local storage on mount
  useEffect(() => {
    const savedConfigStr = localStorage.getItem('metarh_banner_config');
    if (savedConfigStr) {
      try {
        const savedConfig = JSON.parse(savedConfigStr);
        setBannerConfig(savedConfig);
        setTempBannerUrl(savedConfig.url);
      } catch (e) {
        console.error("Error parsing saved banner config", e);
      }
    } else {
      // Legacy fallback
      const legacyBanner = localStorage.getItem('metarh_banner');
      if (legacyBanner) {
        setBannerConfig({ ...DEFAULT_BANNER_CONFIG, url: legacyBanner });
        setTempBannerUrl(legacyBanner);
      }
    }
  }, []);

  // Global mouse up to stop dragging
  useEffect(() => {
    const handleWindowMouseUp = () => {
      setDragTarget(null);
      dragStartRef.current = null;
    };
    
    const handleWindowMouseMove = (e: MouseEvent) => {
        if (dragTarget && dragStartRef.current) {
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;
            
            if (dragTarget === 'photo') {
                setUserData(prev => ({
                    ...prev,
                    photoX: prev.photoX + dx,
                    photoY: prev.photoY + dy
                }));
            } else if (dragTarget === 'banner') {
                setBannerConfig(prev => ({
                    ...prev,
                    // Reverted to 1:1 movement (just dx) because translate operates on the pre-scaled coordinate system center
                    // which matches visual pixel movement for positioning.
                    x: prev.x + dx,
                    y: prev.y + dy
                }));
            }
            
            // Reset start position for next frame delta
            dragStartRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    if (dragTarget) {
        window.addEventListener('mouseup', handleWindowMouseUp);
        window.addEventListener('mousemove', handleWindowMouseMove);
    }

    return () => {
        window.removeEventListener('mouseup', handleWindowMouseUp);
        window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, [dragTarget]);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    setUploadedUrl(null); // Reset upload if data changes
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData((prev) => ({ 
            ...prev, 
            photoUrl: reader.result as string,
            // Reset position on new photo
            photoX: 0,
            photoY: 0,
            photoScale: 1
        }));
        setUploadedUrl(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoMouseDown = (e: React.MouseEvent) => {
      if (userData.photoUrl) {
          e.preventDefault();
          setDragTarget('photo');
          dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
  };

  const handleBannerMouseDown = (e: React.MouseEvent) => {
    // Allow drag if we are admin and have EITHER a saved url OR a temp url (newly uploaded)
    if (isAdmin && (bannerConfig.url || tempBannerUrl)) {
        e.preventDefault();
        setDragTarget('banner');
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        
        // Load image to determine dimensions for auto-alignment
        const img = new Image();
        img.onload = () => {
            const width = img.width;
            // Calculate X to align the right edge of the image with the right edge of the container (620px)
            // Container center is 0. Right edge is +310.
            // Image center is 0 (relative to itself). Right edge is +width/2.
            // We want ImageRightEdge to equal ContainerRightEdge.
            // (Position + width/2) = 310
            // Position = 310 - width/2
            const alignRightX = 310 - (width / 2);

            setTempBannerUrl(result);
            setBannerConfig(prev => ({ 
                ...prev, 
                x: alignRightX, 
                y: 0, 
                scale: 1 
            }));
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveBanner = () => {
    if (tempBannerUrl) {
      const newConfig = {
        ...bannerConfig,
        url: tempBannerUrl
      };
      setBannerConfig(newConfig);
      localStorage.setItem('metarh_banner_config', JSON.stringify(newConfig));
      alert('Banner atualizado com sucesso!');
    }
  };

  const clearBanner = () => {
    setBannerConfig(DEFAULT_BANNER_CONFIG);
    setTempBannerUrl(null);
    localStorage.removeItem('metarh_banner_config');
    localStorage.removeItem('metarh_banner'); // cleanup legacy
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === 'marketing' && loginPass === 'marketing2026') {
      setIsAdmin(true);
      setShowLogin(false);
    } else {
      alert('Credenciais inválidas');
    }
  };

  const handleGenerateAndUpload = async () => {
    if (!signatureRef.current) return;
    
    setIsUploading(true);
    setUploadedUrl(null);

    try {
        const blob = await toBlob(signatureRef.current, { quality: 1.0, pixelRatio: 2 });
        if (!blob) throw new Error("Falha ao gerar imagem");

        const cleanName = userData.name.trim().toLowerCase().split(/\s+/).join('-') || 'assinatura';
        const file = new File([blob], `${cleanName}.png`, { type: 'image/png' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('METARH2026#4886', 'metarh-assinaturas-2025');

        const response = await fetch('https://metarh.com.br/wp-json/assinaturas/v1/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log(result);

        if (result && (result.url || result.link || typeof result === 'string')) {
            const url = result.url || result.link || result;
            setUploadedUrl(url);
        } else if (result && result.error) {
            alert('Erro ao subir imagem: ' + result.error);
        } else {
             // Fallback if structure is unknown but successful
             alert('Upload realizado, verifique o console para URL.');
        }

    } catch (err) {
        console.error('Erro:', err);
        alert('Erro ao gerar/enviar assinatura. Tente novamente.');
    } finally {
        setIsUploading(false);
    }
  };

  const handleCopyImage = async () => {
      if (!signatureRef.current) return;
      try {
          const blob = await toBlob(signatureRef.current, { quality: 1.0, pixelRatio: 2 });
          if (!blob) return;
          
          await navigator.clipboard.write([
              new ClipboardItem({
                  [blob.type]: blob
              })
          ]);
          alert("Imagem copiada para a área de transferência!");
      } catch (err) {
          console.error(err);
          alert("Não foi possível copiar a imagem diretamente. Tente usar o botão de copiar link.");
      }
  };

  const handleCopyLink = () => {
      if (uploadedUrl) {
          navigator.clipboard.writeText(uploadedUrl);
          alert("Link copiado!");
      }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-[#401669] text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold font-sans">Gerador de Assinatura METARH</h1>
          <button 
            onClick={() => isAdmin ? setIsAdmin(false) : setShowLogin(!showLogin)}
            className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition"
          >
            {isAdmin ? 'Sair do Admin' : 'Área Admin'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Controls */}
        <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-sm space-y-6 h-fit">
          
          {/* Admin Login Modal/Panel */}
          {showLogin && !isAdmin && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded">
              <h3 className="font-bold text-[#401669] mb-3">Login Marketing</h3>
              <form onSubmit={handleLogin} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Usuário" 
                  className="w-full border p-2 rounded"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                />
                <input 
                  type="password" 
                  placeholder="Senha" 
                  className="w-full border p-2 rounded"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                />
                <button type="submit" className="w-full bg-[#401669] text-white py-2 rounded hover:bg-purple-900">
                  Entrar
                </button>
              </form>
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin ? (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded">
              <h2 className="text-xl font-bold text-orange-800 mb-4">Painel Marketing</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Imagem do Banner</label>
                  <input type="file" accept="image/*" onChange={handleBannerSelect} className="w-full text-sm" />
                  
                  {/* TIP FOR SIZE */}
                  <div className="mt-2 text-xs bg-white p-2 rounded border border-gray-200 text-gray-600">
                     <strong>Área livre:</strong> O banner agora ocupa toda a extensão (620x250px).
                     <br/>
                     Arraste a imagem no preview para a direita para posicionar sua arte curva sem cortes.
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Selecione a imagem. Use o preview para <strong>arrastar</strong> e o slider abaixo para dar zoom.
                  </p>
                </div>

                {tempBannerUrl && (
                  <div className="p-2 bg-orange-100/50 rounded">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-gray-600">Zoom do Banner</span>
                          <span className="text-xs bg-white px-2 rounded">{Math.round(bannerConfig.scale * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="3" 
                        step="0.05" 
                        value={bannerConfig.scale}
                        onChange={(e) => setBannerConfig(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-orange-300 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                    <button 
                        onClick={saveBanner}
                        disabled={!tempBannerUrl}
                        className={`flex-1 py-2 px-4 rounded font-bold text-white transition ${!tempBannerUrl ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        Salvar e Confirmar
                    </button>
                    {bannerConfig.url && (
                        <button 
                            onClick={clearBanner}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded border border-red-200"
                        >
                            Remover
                        </button>
                    )}
                </div>
              </div>
            </div>
          ) : (
            /* User Controls */
            <>
              <h2 className="text-xl font-bold border-b pb-2 text-[#401669]">Seus Dados</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={userData.name} 
                    onChange={handleInputChange} 
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#401669] outline-none"
                    placeholder="Ex: Rodrigo Aquino"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Cargo / Setor</label>
                  <input 
                    type="text" 
                    name="role" 
                    value={userData.role} 
                    onChange={handleInputChange} 
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#401669] outline-none"
                    placeholder="Ex: Marketing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Telefone</label>
                  <input 
                    type="text" 
                    name="phone" 
                    value={userData.phone} 
                    onChange={handleInputChange} 
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#401669] outline-none"
                    placeholder="Ex: 11 99648-6816"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">E-mail</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={userData.email} 
                    onChange={handleInputChange} 
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#401669] outline-none"
                    placeholder="Ex: nome@metarh.com.br"
                  />
                </div>

                <div className="pt-4 border-t">
                  <label className="block text-sm font-bold mb-2">Sua Foto</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-[#401669] hover:file:bg-purple-100"
                  />
                  
                  {userData.photoUrl && (
                    <div className="mt-4 space-y-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                      <p className="text-xs font-bold text-[#401669] uppercase border-b pb-1 mb-2">Ajuste a Foto</p>
                      
                      {/* Didactic Controls: Cursor text and Zoom */}
                      <div className="flex flex-col gap-4">
                        <div className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#401669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20"/></svg>
                             <span>Clique e arraste a foto na visualização ao lado para posicionar.</span>
                        </div>

                        {/* Zoom */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-gray-600">Zoom</span>
                                <span className="text-xs bg-gray-200 px-2 rounded">{Math.round(userData.photoScale * 100)}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="1" 
                              max="3" 
                              step="0.05" 
                              value={userData.photoScale}
                              onChange={(e) => setUserData(prev => ({ ...prev, photoScale: parseFloat(e.target.value) }))}
                              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#401669]"
                            />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="flex-1 flex flex-col items-center">
          <div className="sticky top-6 space-y-6 w-full flex flex-col items-center">
            
            <div className={`bg-white p-1 border shadow-sm inline-block ${dragTarget ? 'cursor-move' : ''}`}>
               <SignaturePreview 
                    ref={signatureRef} 
                    data={userData} 
                    bannerUrl={isAdmin && tempBannerUrl ? tempBannerUrl : bannerConfig.url} 
                    bannerConfig={bannerConfig}
                    onPhotoMouseDown={handlePhotoMouseDown}
                    onBannerMouseDown={handleBannerMouseDown}
                    isAdmin={isAdmin}
               />
            </div>

            <div className="text-center space-y-4 w-full max-w-[620px]">
                {!uploadedUrl ? (
                    <button 
                        onClick={handleGenerateAndUpload}
                        disabled={isUploading}
                        style={{ backgroundColor: '#ff27f9' }}
                        className="w-1/2 mx-auto hover:opacity-90 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                    >
                        {isUploading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Gerando...
                            </span>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                Gerar Assinatura
                            </>
                        )}
                    </button>
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-purple-100 animate-fade-in space-y-4">
                        <div className="text-center mb-4">
                             <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-2">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                             </div>
                             <h3 className="text-lg font-medium text-gray-900">Assinatura Pronta!</h3>
                        </div>

                        <div className="flex flex-col gap-3">
                            <input 
                                type="text" 
                                readOnly 
                                value={uploadedUrl} 
                                className="w-full text-sm bg-gray-50 border border-gray-200 rounded p-2 text-gray-500"
                            />
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleCopyLink}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded border border-gray-300 transition"
                                >
                                    Copiar Link
                                </button>
                                <button 
                                    onClick={handleCopyImage}
                                    className="flex-1 bg-[#401669] hover:bg-[#2d0f4b] text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    Copiar Imagem
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Para usar no Gmail: Clique em "Copiar Imagem" e cole diretamente nas configurações de assinatura (Ctrl+V ou Cmd+V).
                        </p>
                        
                        <button 
                            onClick={() => setUploadedUrl(null)} 
                            className="text-xs text-purple-600 underline mt-2"
                        >
                            Gerar nova assinatura
                        </button>
                    </div>
                )}
            </div>
            
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;