import React, { useState, useRef, useEffect } from 'react';
import { toBlob } from 'html-to-image';
import { DEFAULT_USER_DATA, UserData } from './types';
import SignaturePreview from './components/SignaturePreview';
import { MetarhLogoHorizontal } from './components/Icons';

function App() {
  // State
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA);
  const [ddd, setDdd] = useState('');
  const [phonePart, setPhonePart] = useState('');

  // Drag state
  const [dragTarget, setDragTarget] = useState<'photo' | null>(null);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const signatureRef = useRef<HTMLDivElement>(null);
  const signatureGenerationRef = useRef<HTMLDivElement>(null); // Ref para geração sem banner

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

  // Sync phone parts to userData
  useEffect(() => {
    if (ddd || phonePart) {
      setUserData(prev => ({ ...prev, phone: `${ddd} ${phonePart}` }));
    } else {
      setUserData(prev => ({ ...prev, phone: '' }));
    }
  }, [ddd, phonePart]);


  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    setUploadedUrl(null); // Reset upload if data changes
  };

  const handleDddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only digits, max 2 chars
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDdd(val);
    setUploadedUrl(null);
  };

  const handlePhonePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only digits
    const val = e.target.value.replace(/\D/g, '');
    // Format: XXXXX-XXXX or XXXX-XXXX
    // We will let them type and apply masking

    let formatted = val;
    if (val.length > 5) {
      // Splitting at length-4 for the last part is standard for BR numbers
      // but usually it's 4+4 or 5+4.
      // Let's assume standard mobile 9 digits (5+4) or landline 8 digits (4+4).
      // Simple logic: insert hyphen before the last 4 digits
      if (val.length <= 8) {
        formatted = val.replace(/(\d{4})(\d{0,4})/, '$1-$2');
      } else {
        formatted = val.replace(/(\d{5})(\d{0,4})/, '$1-$2');
      }
    }
    // Limit to max chars (9 digits + 1 hyphen = 10 chars)
    if (formatted.length > 10) formatted = formatted.slice(0, 10);

    setPhonePart(formatted);
    setUploadedUrl(null);
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

  const handleGenerateAndUpload = async () => {
    if (!signatureGenerationRef.current) return;

    setIsUploading(true);
    setUploadedUrl(null);

    try {
      console.log("Iniciando geração...");

      // Gerar imagem com alta qualidade (pixelRatio 3 = 3x resolução)
      const blob = await toBlob(signatureGenerationRef.current, {
        quality: 1.0,      // Qualidade máxima
        pixelRatio: 1,     // 1x resolução (600x250px) - Tamanho ideal para assinatura
        cacheBust: true    // Evita cache
      });
      if (!blob) throw new Error("Falha ao gerar o arquivo de imagem.");

      // Gerar nome do arquivo: nome-departamento.png
      const cleanName = userData.name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .split(/\s+/)
        .join('-');

      const cleanRole = userData.role
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .split(/\s+/)
        .join('-');

      const fileName = `${cleanName}-${cleanRole}.png`;
      console.log('Nome do arquivo gerado:', fileName);

      // VALIDAÇÃO: Garantir que nunca seja banner-assinatura.png
      if (fileName.toLowerCase() === 'banner-assinatura.png') {
        throw new Error('Erro: Nome de arquivo inválido. Por favor, preencha nome e departamento corretamente.');
      }

      // Validação adicional: garantir que o nome não está vazio
      if (!cleanName || !cleanRole) {
        throw new Error('Por favor, preencha o nome completo e selecione um departamento.');
      }

      const file = new File([blob], fileName, { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', file);

      const endpoint = 'https://metarh.com.br/wp-content/uploads/assinaturas/upload.php';
      console.log(`Enviando para ${endpoint}`);

      // Usando fetch normal. 
      // Se der CORS, vai cair no catch com 'Failed to fetch'.
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer METARH2026#4886' },
        body: formData
      });

      const responseText = await response.text();
      console.log("Response:", response.status, responseText);

      if (!response.ok) {
        throw new Error(`Erro Servidor (${response.status}): ${responseText.slice(0, 150)}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Resposta inválida do servidor: ${responseText.slice(0, 100)}`);
      }

      console.log("JSON Parseado:", result);

      if (result && (result.url || result.link || typeof result === 'string')) {
        const url = result.url || result.link || result;
        setUploadedUrl(url);
      } else if (result && result.error) {
        throw new Error('Servidor retornou erro: ' + result.error);
      } else {
        alert('Upload feito, mas retorno desconhecido. Veja console.');
        console.warn("Resposta estranha:", result);
      }

    } catch (err: any) {
      console.error('Erro:', err);
      const msg = err && err.message ? err.message : String(err);
      if (msg.includes("Failed to fetch")) {
        alert("Erro de Conexão/CORS. O servidor de upload bloqueou a requisição deste site.");
      } else {
        alert(`Erro: ${msg}`);
      }
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

  const roles = [
    "Admissão",
    "Atendimento",
    "Benefícios",
    "Business Intelligence",
    "Comercial",
    "Diretoria",
    "Facilities",
    "Financeiro",
    "Folha",
    "Gente e Gestão",
    "Jurídico",
    "Marketing",
    "Ponto",
    "Projetos e TI",
    "Qualidade e Experiência",
    "Recrutamento e Seleção"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-[#401669] text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-center items-center">
          <div className="w-44">
            <MetarhLogoHorizontal />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6 flex flex-col lg:flex-row gap-8">

        {/* Left Column: Controls */}
        <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-sm space-y-6 h-fit">

          <h2 className="text-xl font-bold border-b pb-2 text-[#401669]">Seus Dados</h2>

          <div className="space-y-4">

            {/* Photo Section with more emphasis */}
            <div className="p-4 bg-purple-50 border-2 border-dashed border-[#401669] rounded-xl relative group hover:bg-purple-100 transition-colors">
              <label className="block text-base font-bold text-[#401669] mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                1. Escolha sua Foto
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#401669] file:text-white hover:file:bg-[#2d0f4b] cursor-pointer"
              />

              {userData.photoUrl && (
                <div className="mt-4 space-y-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                  <p className="text-xs font-bold text-[#401669] uppercase border-b pb-1 mb-2">Ajuste a Foto</p>

                  <div className="flex flex-col gap-4">
                    <div className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#401669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20" /></svg>
                      <span>Clique e arraste a foto na visualização ao lado para posicionar.</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-600">Zoom</span>
                        <span className="text-xs bg-gray-200 px-2 rounded">{Math.round(userData.photoScale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
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

            <div>
              <label className="block text-sm font-semibold mb-1">Primeiro e último nome</label>
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
              <label className="block text-sm font-semibold mb-1">Área / Departamento</label>
              <select
                name="role"
                value={userData.role}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#401669] outline-none bg-white"
              >
                <option value="">Selecione...</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Telefone</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ddd}
                  onChange={handleDddChange}
                  className="w-16 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#401669] outline-none text-center"
                  placeholder="DDD"
                  maxLength={2}
                />
                <input
                  type="text"
                  value={phonePart}
                  onChange={handlePhonePartChange}
                  className="flex-1 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#401669] outline-none"
                  placeholder="99999-9999"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="showQrCode"
                checked={userData.showQrCode}
                onChange={(e) => setUserData(prev => ({ ...prev, showQrCode: e.target.checked }))}
                className="w-4 h-4 text-[#401669] border-gray-300 rounded focus:ring-[#401669] accent-[#401669]"
              />
              <label htmlFor="showQrCode" className="text-sm font-semibold select-none cursor-pointer text-gray-700">
                Incluir QR Code do WhatsApp
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Website</label>
              <input
                type="text"
                name="website"
                value={userData.website}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#401669] outline-none"
                placeholder="Ex: www.metarh.com.br"
              />
            </div>

          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="flex-1 flex flex-col items-center">
          <div className="sticky top-6 space-y-6 w-full flex flex-col items-center">

            <div className={`bg-white p-1 border shadow-sm inline-block ${dragTarget ? 'cursor-move' : ''}`}>
              <SignaturePreview
                ref={signatureRef}
                data={userData}
                onPhotoMouseDown={handlePhotoMouseDown}
              />
            </div>

            {/* Componente invisível usado para geração COM banner (CORS configurado) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
              <SignaturePreview
                ref={signatureGenerationRef}
                data={userData}
                showBanner={true}
              />
            </div>

            <p className="text-[10px] text-gray-400 text-center max-w-[600px] mt-2 mb-2">
              ✨ A assinatura gerada incluirá o banner da campanha na lateral direita, sua foto, nome e informações de contato em alta qualidade.
            </p>

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
                    <h3 className="text-lg font-medium text-gray-900">Assinatura Gerada com Sucesso!</h3>
                    <p className="text-sm text-gray-500 mt-1">Sua imagem está hospedada e pronta para usar</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">📧 Como usar no Gmail:</h4>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Copie a URL abaixo</li>
                      <li>Abra as Configurações do Gmail → Assinatura</li>
                      <li>Clique no ícone de imagem (🖼️)</li>
                      <li>Cole a URL copiada</li>
                      <li><strong>Selecione "Melhor ajuste"</strong> no tamanho da imagem</li>
                      <li>Salve as alterações</li>
                    </ol>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">URL da sua assinatura:</label>
                      <input
                        type="text"
                        readOnly
                        value={uploadedUrl}
                        onClick={(e) => e.currentTarget.select()}
                        className="w-full text-sm bg-gray-50 border border-gray-300 rounded p-3 text-gray-700 font-mono cursor-pointer hover:bg-gray-100"
                        title="Clique para selecionar tudo"
                      />
                    </div>

                    <button
                      onClick={handleCopyLink}
                      className="w-full bg-[#401669] hover:bg-[#2d0f4b] text-white font-semibold py-3 px-4 rounded transition flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      Copiar URL
                    </button>
                  </div>

                  <button
                    onClick={() => setUploadedUrl(null)}
                    className="text-sm text-purple-600 hover:text-purple-800 underline mt-2"
                  >
                    ← Gerar nova assinatura
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