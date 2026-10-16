(function(){
  'use strict';

  var going=false;

  function store(){
    try{
      return sessionStorage.getItem('aeternaStore')==='1';
    }catch(e){
      return false;
    }
  }

  // ... aquí sigue el resto de tu código

  function mark(v){
    try{
      if(v){
        sessionStorage.setItem('aeternaLogin','1');
      }else{
        sessionStorage.removeItem('aeternaLogin');
      }
    }catch(e){}
  }

  function justLogged(){
    try{
      return sessionStorage.getItem('aeternaLogin')==='1';
    }catch(e){
      return false;
    }
  }

  function reveal(){
    document.documentElement.classList.remove('aeterna-redirecting');
  }

  document.addEventListener('submit',function(e){

    if(e.target && e.target.id==='authForm'){

      mark(true);

      try{
        sessionStorage.removeItem('aeternaStore');
      }catch(_){}
    }

  },true);


  async function route(session){

    if(going || !session || !window.supabaseClient){
      return;
    }

    if(!justLogged() && store()){
      reveal();
      return;
    }

    going=true;

    try{

      var r=await window.supabaseClient
        .from('profiles')
        .select('role')
        .eq('id',session.user.id)
        .maybeSingle();

      console.log('🔎 REDIRECT CHECK');
      console.log('Usuario:',session.user.id);
      console.log('Perfil:',r.data);
      console.log('Error:',r.error);

      var admin=!!(
        r.data &&
        r.data.role==='admin'
      );

      mark(false);

      if(admin){

        console.log('🌸 ADMIN DETECTADO');
        console.log('➡️ ADMIN LO MANEJA index.html');

        reveal();
        return;
      }

      console.log('👤 USUARIO NORMAL');
      console.log('➡️ REDIRIGIENDO A perfil.html');

      window.location.replace('perfil.html');

    }catch(err){

      console.error(
        'Error comprobando redirección:',
        err
      );

      going=false;
      mark(false);
      reveal();
    }
  }


  function attach(){

    var c=window.supabaseClient;

    if(!c){
      return setTimeout(attach,120);
    }

    c.auth.onAuthStateChange(function(event,session){

      if(event==='INITIAL_SESSION'){

        if(session){
          setTimeout(function(){
            route(session);
          },0);
        }else{
          mark(false);
          reveal();
        }

        return;
      }

      if(event==='SIGNED_IN'){

        if(!justLogged()){
          return;
        }

        setTimeout(function(){
          route(session);
        },0);
      }

    });
  }

  attach();

})();