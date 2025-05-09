
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

export const navLinks: Links[] = [
    { id: 'LINKSINICIO', name: 'INICIO', url: '/' },
    {
        id: 'LINKSADOPTA', name: 'ADOPTÁ', url: '/adopta', 
        // childs: [
        //     { id: 'LINKSADOPTACONOCELOS', name: 'CONOCELOS', url: '/#conocelos' },
        //     { id: 'LINKSADOPTAQUIEROADOTAR', name: 'QUIERO ADOPTAR', url: '/#quiero-adoptar' },
        //     { id: 'LINKSADOPTAREQUISITOSDEADOPCION', name: 'REQUISOTOS DE ADOPCIÓN', url: '/#requisitos-de-adopcion' },
        // ]
    },
    {
        id: 'LINKSDONA', name: 'DONA', url: '/donaciones', childs: [
            { id: 'LINKSDONACIONESAPORTESECONOMICOS', name: 'APORTES ECONÓMICOS', url: '/donaciones#aportes-economicos' },
            { id: 'LINKSDONACIONESDONACIONDEINSUMOS', name: 'DONACÓN DE INSUMOS', url: '/donaciones#donacion-de-insumos' },]
    },
    {
        id: 'LINKSINVOLUCRATE', name: 'INVOLUCRATE', url: '/involucrate', childs: [
            { id: 'LINKSINVOLUCRATETRANSITORIO', name: 'TRANSITORIO', url: '/involucrate#transitorio' },
            { id: 'LINKSINVOLUCRATECASTRACIONES', name: 'CASTRACIONES', url: '/involucrate#castraciones' },
            { id: 'LINKSINVOLUCRATETRASLADOS', name: 'TRASLADOS SOLIDARIOS', url: '/involucrate#traslados-solidarios' },
            { id: 'LINKSINVOLUCRATEOTRASFORMASDECOLABORAR', name: 'OTRAS FORMAS DE COLABORAR', url: '/involucrate#otras-formas-de-colaborar' },
            { id: 'LINKSINVOLUCRATEDIFUSION', name: 'DIFUSION', url: '/involucrate#difusion' },
            { id: 'LINKSINVOLUCRATEDENUNCIA', name: 'DENUNCIA MALTRATO', url: '/involucrate#denuncia-maltrato' },
            

        ]
    },
    { id: 'LINKSNOSOTROS', name: 'NOSOTROS', url: '/nosotros', childs: [
        { id: 'LINKSNOSOTROSQUIENESSOMOS', name: 'QUIENES SOMOS', url: '/nosotros#quienes-somos' },
        { id: 'LINKSNOSOTROSREDES', name: 'REDES SOCIALES', url: '/nosotros#redes-sociales' },
        { id: 'LINKSNOSOTROSEMAIL', name: 'EMAIL', url: '/nosotros#email' },
    ] },
]

