interface LinkChild {
  id: string;
  name: string;
  url: string;
}

interface Links {
  id: string;
  name: string;
  url: string;
  childs?: LinkChild[];
}

/**
 * Navigation links configuration for the application.
 *
 * Defines the structure and hierarchy of navigation links, including main links and optional child links.
 * Each link includes:
 *   - id: Unique identifier for the link.
 *   - name: Display name for the link.
 *   - url: URL path for navigation.
 *   - childs (optional): Array of child links with the same structure.
 *
 * @example
 * // Render navigation links
 * <nav>
 *   <ul>
 *     {navLinks.map((link) => (
 *       <li key={link.id + 'father'}>
 *         <Link
 *           href={link.url} >
 *           {link.name}
 *         </Link>
 *         {link.childs && (
 *           <ul >
 *             {link.childs.map((child) => (
 *               <li key={child.id + 'child'}>
 *                 <Link
 *                   href={child.url}
 *                 >
 *                   {child.name}
 *                 </Link>
 *               </li>
 *             ))}
 *           </ul>
 *         )}
 *       </li>
 *     ))}
 *   </ul>
 * </nav>
 */
export const navLinks: Links[] = [
  { id: 'LINKSINICIO', name: 'INICIO', url: '/' },
  {
    id: 'LINKSADOPTA',
    name: 'ADOPTÁ',
    url: '/adopta',
    // childs: [
    //     { id: 'LINKSADOPTACONOCELOS', name: 'CONOCELOS', url: '/#conocelos' },
    //     { id: 'LINKSADOPTAQUIEROADOTAR', name: 'QUIERO ADOPTAR', url: '/#quiero-adoptar' },
    //     { id: 'LINKSADOPTAREQUISITOSDEADOPCION', name: 'REQUISOTOS DE ADOPCIÓN', url: '/#requisitos-de-adopcion' },
    // ]
  },
  {
    id: 'LINKSDONA',
    name: 'DONA',
    url: '/donaciones',
    childs: [
      {
        id: 'LINKSDONACIONES3IMPACTO',
        name: 'COMUNIDAD 3IMPACTO',
        url: 'https://3impacto.eco/marketplace/proyecto-plam',
      },
      {
        id: 'LINKSDONACIONESAPORTESECONOMICOS',
        name: 'APORTES ECONÓMICOS',
        url: '/donaciones#aportes-economicos',
      },
      {
        id: 'LINKSDONACIONESDONACIONDEINSUMOS',
        name: 'DONACÓN DE INSUMOS',
        url: '/donaciones#donacion-de-insumos',
      },
    ],
  },
  {
    id: 'LINKSINVOLUCRATE',
    name: 'INVOLUCRATE',
    url: '/involucrate',
    childs: [
      { id: 'LINKSINVOLUCRATETRANSITORIO', name: 'TRANSITORIO', url: '/involucrate#transitorio' },
      {
        id: 'LINKSINVOLUCRATECASTRACIONES',
        name: 'CASTRACIONES',
        url: '/involucrate#castraciones',
      },
      {
        id: 'LINKSINVOLUCRATETRASLADOS',
        name: 'TRASLADOS SOLIDARIOS',
        url: '/involucrate#traslados-solidarios',
      },
      {
        id: 'LINKSINVOLUCRATEOTRASFORMASDECOLABORAR',
        name: 'OTRAS FORMAS DE COLABORAR',
        url: '/involucrate#otras-formas-de-colaborar',
      },
      { id: 'LINKSINVOLUCRATEDIFUSION', name: 'DIFUSION', url: '/involucrate#difusion' },
      {
        id: 'LINKSINVOLUCRATEDENUNCIA',
        name: 'DENUNCIA MALTRATO',
        url: '/involucrate#denuncia-maltrato',
      },
    ],
  },
  {
    id: 'LINKSNOSOTROS',
    name: 'NOSOTROS',
    url: '/nosotros',
    childs: [
      { id: 'LINKSNOSOTROSQUIENESSOMOS', name: 'QUIENES SOMOS', url: '/nosotros#quienes-somos' },
      { id: 'LINKSNOSOTROSREDES', name: 'REDES SOCIALES', url: '/nosotros#redes-sociales' },
      { id: 'LINKSNOSOTROSEMAIL', name: 'EMAIL', url: '/nosotros#email' },
    ],
  },
];

/* ─────────────────────────  USAGE EXAMPLES  ──────────────────────────

Render navigation links in a React component
   <nav>
     <ul>
       {navLinks.map((link) => (
         <li key={link.id + 'father'}>
           <Link href={link.url}>{link.name}</Link>
           {link.childs && (
             <ul>
               {link.childs.map((child) => (
                 <li key={child.id + 'child'}>
                   <Link href={child.url}>{child.name}</Link>
                 </li>
               ))}
             </ul>
           )}
         </li>
       ))}
     </ul>
   </nav>


──────────────────────────────────────────────────────────────────────────── */
