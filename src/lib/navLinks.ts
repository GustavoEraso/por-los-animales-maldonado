
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
    { id: 'LINKSNOSOTROS', name: 'NOSOTROS', url: '/nosotros' },
    {
        id: 'LINKSADOPTA', name: 'ADOPTÁ', url: '/#adopta', childs: [
            { id: 'LINKSADOPTACONOCELOS', name: 'CONOCELOS', url: '/#conocelos' },
            { id: 'LINKSADOPTAQUIEROADOTAR', name: 'QUIERO ADOPTAR', url: '/#quiero-adoptar' },
            { id: 'LINKSADOPTAREQUISITOSDEADOPCION', name: 'REQUISOTOS DE ADOPCIÓN', url: '/#requisitos-de-adopcion' },
        ]
    },
    {
        id: 'LINKSSALVAVIDAS', name: 'SALVÁ VIDAS', url: '/#salva-vidas', childs: [
            { id: 'LINKSSALVAVIDASCASTA', name: 'CASTRÁ', url: '/#castrá' },
            { id: 'LINKSSALVAVIDASDENICIAMALTRATO', name: 'DENINCIA EL MALTRATO', url: '/#denuncia-el-maltrato' },
        ]
    },
    {
        id: 'LINKSPARTICIPA', name: 'PARTICIPÁ', url: '/#cparticipa', childs: [
            { id: 'LINKSPARTICIPAVOLUNTARIOS', name: 'VOLUNTARIOS', url: '/#sobre-nosotros' },
            { id: 'LINKSPARTICIPAHOGARDETRANSITO', name: 'HOGAR DE TRÁNSITO', url: '/#hogar-de-transito' },

        ]
    },
    { id: 'LINKSTIENDA', name: 'TIENDA', url: '/#tienda' },
    {
        id: 'LINKSDONACIONES', name: 'DONACIONES', url: '/#donaciones', childs: [
            { id: 'LINKSDONACIONESAPORTESECONOMICOS', name: 'APORTES ECONÓMICOS', url: '/#aportes-economicos' },
            { id: 'LINKSDONACIONESDONACIONDEINSUMOS', name: 'DONACÓN DE INSUMOS', url: '/#donacion-de-insumos' },]
    },
    { id: 'LINKSCONTACTO', name: 'CONTACTO', url: '/#contacto' },
]

