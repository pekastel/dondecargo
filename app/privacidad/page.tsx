import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad - DondeCargo',
  description: 'Política de privacidad y tratamiento de datos personales de la plataforma DondeCargo.',
};

export default function PoliticaDePrivacidad() {
  return (
    <div className="container mx-auto">
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">Política de Privacidad</h1>
        <p className="text-sm italic text-muted-foreground mb-8">Última actualización: 11 de agosto de 2025</p>

        <div className="prose prose-blue max-w-none">
          <h2>1. Introducción y Alcance</h2>
          <p>
            Esta Política de Privacidad describe cómo DondeCargo (&quot;la Plataforma&quot;) recolecta, utiliza,
            almacena y protege los datos personales de las personas usuarias. Al utilizar la Plataforma,
            usted acepta las prácticas aquí descriptas y los
            {' '}
            <a href="/terminos-y-condiciones.html">Términos y Condiciones</a>.
          </p>

          <h2>2. Responsable del Tratamiento</h2>
          <p>
            El responsable de tratamiento es DondeCargo, operado por Lumile Argentina S.A. Para consultas,
            utilice los canales de contacto disponibles en{' '}
            <a href="/contacto">/contacto</a>.
          </p>

          <h2>3. Datos que Recolectamos</h2>
          <p>Recolectamos y tratamos las siguientes categorías de datos, según el uso de la Plataforma:</p>
          <ul>
            <li>
              <strong>Cuenta de usuario:</strong> nombre, correo electrónico, imagen de perfil (opcional),
              estado de verificación de email, fechas de creación/actualización, rol y aceptación de Términos.
            </li>
            <li>
              <strong>Autenticación y sesiones:</strong> identificadores y metadatos de sesión (token, fecha de
              expiración, fecha de creación/actualización), dirección IP y agente de usuario. Si utiliza
              proveedores externos (OAuth), almacenamos los identificadores necesarios del proveedor y
              credenciales/tokens asociados para autenticar su sesión.
            </li>
            <li>
              <strong>Actividad en la Plataforma:</strong> reportes de precios realizados por usted (estación
              asociada, tipo de combustible, precio, horario, notas y marcas de tiempo),
              confirmaciones/validaciones de precios de terceros (asociadas a su usuario y al precio confirmado)
              y estaciones marcadas como favoritas.
            </li>
            <li>
              <strong>Datos no personales:</strong> información pública y datos abiertos de fuentes oficiales
              (por ejemplo, datos.energia.gob.ar) y datos agregados/anonimizados con fines estadísticos.
            </li>
            <li>
              <strong>Comunicaciones:</strong> mensajes o consultas que nos envíe a través de los canales de contacto.
            </li>
          </ul>

          <h2>4. Finalidades del Tratamiento</h2>
          <p>Utilizamos sus datos para:</p>
          <ul>
            <li>Prestar, mantener y mejorar la Plataforma (búsqueda, visualización y comparación de precios).</li>
            <li>Gestionar su cuenta y procesos de autenticación/seguridad.</li>
            <li>Permitir reportes, confirmaciones y favoritos, y asegurar la calidad de los datos.</li>
            <li>Prevenir el fraude, abusos y garantizar la integridad del sistema.</li>
            <li>Realizar análisis estadísticos y obtener métricas de uso mediante datos agregados o anonimizados.</li>
            <li>Comunicarnos con usted respecto del servicio, novedades o cambios relevantes.</li>
          </ul>

          <h2>5. Base Legal</h2>
          <p>Tratamos los datos sobre las siguientes bases legales, según corresponda:</p>
          <ul>
            <li>Ejecución del contrato (proveerle la Plataforma y sus funcionalidades).</li>
            <li>Consentimiento (por ejemplo, creación de cuenta y aceptación de Términos).</li>
            <li>Interés legítimo (seguridad, prevención de fraude y mejora del servicio).</li>
            <li>Cumplimiento de obligaciones legales.</li>
          </ul>

          <h2>6. Conservación</h2>
          <p>
            Conservamos sus datos mientras su cuenta esté activa o resulte necesario para las finalidades indicadas,
            y por los plazos adicionales que exijan normativas aplicables. Los datos agregados o anonimizados pueden
            conservarse indefinidamente.
          </p>

          <h2>7. Destinatarios y Encargados</h2>
          <p>
            Podemos compartir datos con proveedores que prestan servicios de infraestructura, autenticación,
            comunicaciones o analítica, actuando como encargados del tratamiento, bajo obligaciones de
            confidencialidad y seguridad. También podemos compartir información con autoridades competentes cuando
            una obligación legal lo requiera.
          </p>

          <h2>8. Transferencias Internacionales</h2>
          <p>
            Algunos proveedores pueden estar ubicados fuera de su país. En tales casos, adoptamos salvaguardas
            adecuadas para proteger sus datos conforme a la normativa aplicable.
          </p>

          <h2>9. Seguridad</h2>
          <p>
            Implementamos medidas técnicas y organizativas razonables para proteger sus datos contra accesos no
            autorizados, pérdida o alteración. Sin perjuicio de ello, ningún sistema es completamente invulnerable.
          </p>

          <h2>10. Derechos de las Personas Usuarias</h2>
          <p>
            Usted puede ejercer los derechos de acceso, rectificación, actualización, oposición, supresión y,
            cuando corresponda, portabilidad y revocación del consentimiento. Para ejercerlos, contáctenos en
            <a href="/contacto">/contacto</a>. Es posible que solicitemos verificación de identidad antes de
            procesar su solicitud.
          </p>

          <h2>11. Cookies y Tecnologías Similares</h2>
          <p>
            La Plataforma puede utilizar cookies y tecnologías similares para habilitar funcionalidades esenciales,
            recordar preferencias y obtener métricas de uso. Puede gestionar las cookies desde la configuración de
            su navegador. Algunas funciones podrían no operar correctamente si deshabilita ciertas cookies.
          </p>

          <h2>12. Menores de edad</h2>
          <p>
            La Plataforma no está dirigida a menores de 18 años. No recopilamos deliberadamente datos personales de
            menores. Si tomamos conocimiento de datos de un menor sin la debida autorización, procederemos a su
            eliminación. Podés escribirnos en <a href="/contacto">/contacto</a>.
          </p>

          <h2>13. Relación con los Términos y Condiciones</h2>
          <p>
            Esta Política de Privacidad se complementa con los{' '}
            <a href="/terminos-y-condiciones.html">Términos y Condiciones</a>. En caso de conflicto, prevalecerá lo
            dispuesto específicamente para la protección de datos personales conforme a la normativa aplicable.
          </p>

          <h2>14. Cambios a esta Política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas o por razones
            legales u operativas. Publicaremos la versión vigente en esta misma URL, indicando la fecha de última
            actualización.
          </p>

          <h2>15. Contacto</h2>
          <p>
            Para consultas sobre privacidad o ejercicio de derechos, por favor contáctenos a través de{' '}
            <a href="/contacto">/contacto</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
