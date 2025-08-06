"use client";

import { useEffect, useState } from 'react';

export default function TerminosYCondiciones() {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    // Cargar el contenido HTML de los términos y condiciones
    fetch('/terminos-y-condiciones.html')
      .then(response => response.text())
      .then(html => {
        // Extraer solo el contenido del body
        const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
        setHtmlContent(bodyContent);
      })
      .catch(error => {
        console.error('Error al cargar los términos y condiciones:', error);
        setHtmlContent('<p>Error al cargar los términos y condiciones. Por favor, intente nuevamente más tarde.</p>');
      });
  }, []);

  return (
    <div className="container mx-auto">
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">Términos y Condiciones</h1>
        {htmlContent ? (
          <div 
            className="terms-and-conditions prose prose-blue max-w-none" 
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Cargando términos y condiciones...</p>
          </div>
        )}
      </div>
    </div>
  );
}
