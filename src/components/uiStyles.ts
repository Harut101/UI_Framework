import { makeStyles, tokens } from '@fluentui/react-components';
export const useUiStyles = makeStyles({
  field:{width:'100%',minWidth:0}, control:{width:'100%',minWidth:0},
  surface:{padding:tokens.spacingVerticalL,gap:tokens.spacingVerticalS,backgroundColor:tokens.colorNeutralBackground1,border:'1px solid '+tokens.colorNeutralStroke1,borderRadius:tokens.borderRadiusMedium},
  typography:{margin:0,color:tokens.colorNeutralForeground1}, secondary:{color:tokens.colorNeutralForeground2},
  navigation:{display:'flex',flexDirection:'column',gap:tokens.spacingVerticalXXS,width:'100%',minWidth:0},
  navItem:{justifyContent:'flex-start',textAlign:'left',width:'100%',height:'auto',minHeight:'34px',padding:tokens.spacingVerticalS+' '+tokens.spacingHorizontalS},
  selected:{backgroundColor:tokens.colorBrandBackground2,color:tokens.colorBrandForeground2,':hover':{backgroundColor:tokens.colorBrandBackground2Hover}},
  grow:{flex:1,minWidth:0}, count:{marginLeft:'auto'},
  avatar:{flexShrink:0}, badge:{textTransform:'capitalize'},
  drawer:{width:'420px',maxWidth:'calc(100vw - 24px)'}, inlinePanel:{width:'100%',height:'auto',minHeight:'160px',border:'1px solid '+tokens.colorNeutralStroke1,borderRadius:tokens.borderRadiusMedium},
  wideDrawer:{width:'1120px'},
  heading:{color:tokens.colorNeutralForeground1,margin:0}, meta:{display:'flex',gap:tokens.spacingHorizontalS,flexWrap:'wrap'},
  list:{listStyleType:'none',margin:0,padding:0}, listItem:{borderBottom:'1px solid '+tokens.colorNeutralStroke1},
});

