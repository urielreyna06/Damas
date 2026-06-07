import{u as p,a as u,r as c,j as a,S as x}from"./client-CXa5-xVL.js";import{c as h}from"./api-BJy07AZB.js";import{S as f}from"./StaticBoard-C-VpSCjJ.js";import"./skins-COKJgQCr.js";const b=[{id:"easy",name:"Fácil",desc:"IA casual, perfecta para aprender los fundamentos."},{id:"medium",name:"Medio",desc:"IA táctica con búsqueda media. Te pondrá a prueba."},{id:"hard",name:"Difícil",desc:"Minimax con búsqueda profunda. Casi imbatible."}],I=function(){const{isSignedIn:i,getToken:m}=p(),r=u(),[s,t]=c.useState(null),[d,l]=c.useState(null);async function o(e){if(i){t(e),l(null);try{const n=await m(),g=await h(e,n??void 0);await r({to:"/play/$gameId",params:{gameId:g._id}})}catch(n){l(n instanceof Error?n.message:"Error al crear la partida.")}finally{t(null)}}}return a.jsxs("div",{className:"wrap page fade-in",children:[a.jsxs("section",{className:"hero",children:[a.jsxs("div",{className:"stack gap-16",children:[a.jsx("span",{className:"eyebrow",children:"Damas · Player vs IA"}),a.jsxs("h1",{style:{fontSize:"clamp(40px, 5vw, 64px)",lineHeight:1.05},children:["Entrena tu mente.",a.jsx("br",{}),a.jsx("span",{style:{color:"var(--gold)"},children:"Vence a la máquina."})]}),a.jsx("p",{className:"muted",style:{fontSize:17,maxWidth:460},children:"Damas inglesas 8×8 contra una IA con tres niveles de dificultad. Sube en el ranking, desbloquea skins y domina el tablero."}),d&&a.jsxs("div",{className:"badge badge-hard",style:{alignSelf:"flex-start",padding:"8px 14px"},children:[a.jsx("span",{className:"dot"}),d]}),a.jsxs("div",{className:"row gap-12 wrap-w",style:{marginTop:8},children:[i?a.jsx("button",{className:"btn btn-gold btn-lg",onClick:()=>void o("medium"),disabled:s!==null,children:s?"Creando partida…":"Jugar ahora"}):a.jsx(x,{mode:"modal",children:a.jsx("button",{className:"btn btn-gold btn-lg",children:"Iniciar sesión y jugar"})}),a.jsx("button",{className:"btn btn-ghost btn-lg",onClick:()=>r({to:"/leaderboard"}),children:"Ver ranking"})]})]}),a.jsx("div",{className:"hero-board",children:a.jsx(f,{themeId:null})})]}),a.jsxs("section",{style:{marginTop:72},children:[a.jsx("div",{className:"row between",style:{marginBottom:20},children:a.jsx("h2",{className:"serif",style:{fontSize:28},children:"Elige tu desafío"})}),a.jsx("div",{className:"diff-grid",children:b.map(e=>a.jsxs("button",{className:"diff-card","data-diff":e.id,onClick:()=>void o(e.id),disabled:s!==null,"aria-label":`Jugar en dificultad ${e.name}`,children:[a.jsxs("span",{className:`badge badge-${e.id}`,children:[a.jsx("span",{className:"dot"}),e.name]}),a.jsx("div",{className:"diff-name",children:e.name}),a.jsx("div",{className:"diff-desc",children:e.desc}),a.jsx("div",{className:"muted-2",style:{marginTop:16,fontSize:13.5,fontWeight:600},children:s===e.id?"Creando…":i?"Empezar →":"Inicia sesión para jugar"})]},e.id))})]}),a.jsx("style",{children:`
        .hero {
          display: grid;
          grid-template-columns: 1fr minmax(0, 440px);
          gap: 56px;
          align-items: center;
        }
        .hero-board { transform: rotate(2deg); }
        .diff-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 880px) {
          .hero { grid-template-columns: 1fr; }
          .hero-board { max-width: 380px; margin: 0 auto; transform: none; }
          .diff-grid { grid-template-columns: 1fr; }
        }
      `})]})};export{I as component};
