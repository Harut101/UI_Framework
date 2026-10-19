import { createLightTheme, type BrandVariants } from '@fluentui/react-components';
// Guardian Classic palette: cayo.uischema.core/.../Themes/Classic/theme.json and office-palette.json.
const brand: BrandVariants = { 10:'#00070a',20:'#001c26',30:'#003548',40:'#004377',50:'#004f8b',60:'#005ba1',70:'#006cbe',80:'#0078d4',90:'#2897e8',100:'#5ca9e5',110:'#80bce9',120:'#a9d3f2',130:'#c5e1f5',140:'#d0e7f8',150:'#e7f2fc',160:'#f3f9fd' };
export const guardianTheme = {
  ...createLightTheme(brand),
  colorBrandBackground:'#0078d4', colorBrandBackgroundHover:'#006cbe', colorBrandBackgroundPressed:'#005ba1',
  colorBrandForeground1:'#006cbe', colorBrandForeground2:'#005ba1', colorBrandBackground2:'#e7f2fc',
  colorNeutralForeground1:'#323130', colorNeutralForeground2:'#605e5c', colorNeutralForeground3:'#626970',
  colorNeutralBackground1:'#ffffff', colorNeutralBackground2:'#f4f5f6', colorNeutralBackground3:'#eef0f2',
  colorNeutralStroke1:'#d8dde2', colorNeutralStrokeAccessible:'#8a8886',
  colorPaletteGreenForeground1:'#107c41', colorPaletteRedForeground1:'#cf2a28', colorPaletteYellowForeground1:'#885700',
  guardianNavigationBackground:'#2b3442', guardianNavigationHover:'#3e4c5e', guardianNavigationText:'#cbd3dd',
  guardianNavigationBorder:'#637286', guardianCyan:'#00b0f0', guardianLogo:'#25c6ff', guardianOrange:'#ff801e',
  guardianCodeBackground:'#202a38', guardianCodeGutter:'#283545', guardianCodeText:'#e5edf5', guardianCodeMuted:'#afbdcd', guardianCodeBorder:'#526277',
  guardianCalloutBackground:'#fffaf3', guardianCalloutBorder:'#d7b482', guardianCalloutStart:'#a9430c', guardianCalloutEnd:'#41316c',
};
