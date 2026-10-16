
/* =========================================================
   AETERNA — RECUPERACIÓN DE CONTRASEÑA INDEPENDIENTE
   NO MODIFICA EL JS PRINCIPAL
   ========================================================= */

(function () {

  'use strict';

  var recovery = {
    email: '',
    verified: false
  };

  function el(id) {
    return document.getElementById(id);
  }

  function showStep(step) {

    if (el('recoveryStepEmail')) {
      el('recoveryStepEmail').hidden = step !== 'email';
    }

    if (el('recoveryStepCode')) {
      el('recoveryStepCode').hidden = step !== 'code';
    }

    if (el('recoveryStepPassword')) {
      el('recoveryStepPassword').hidden = step !== 'password';
    }

    if (step === 'email') {
      if (el('recoveryTitle'))
        el('recoveryTitle').textContent = 'Recuperar contraseña';

      if (el('recoveryBrandTitle'))
        el('recoveryBrandTitle').textContent = 'Recupera tu cuenta.';

      if (el('recoveryBrandText'))
        el('recoveryBrandText').textContent =
          'Introduce el correo asociado a tu cuenta Aeterna.';
    }

    if (step === 'code') {
      if (el('recoveryTitle'))
        el('recoveryTitle').textContent = 'Verificar tu identidad';

      if (el('recoveryBrandTitle'))
        el('recoveryBrandTitle').textContent = 'Revisa tu correo.';

      if (el('recoveryBrandText'))
        el('recoveryBrandText').textContent =
          'Te enviamos un código de 6 dígitos para verificar tu cuenta.';
    }

    if (step === 'password') {
      if (el('recoveryTitle'))
        el('recoveryTitle').textContent = 'Nueva contraseña';

      if (el('recoveryBrandTitle'))
        el('recoveryBrandTitle').textContent = 'Cuenta protegida.';

      if (el('recoveryBrandText'))
        el('recoveryBrandText').textContent =
          'Tu identidad fue verificada. Ahora puedes cambiar tu contraseña.';
    }
  }


  function clearMessages() {

    [
      'recoveryEmailError',
      'recoveryCodeError',
      'recoveryPasswordError',
      'recoveryConfirmError'
    ].forEach(function (id) {

      if (el(id)) {
        el(id).textContent = '';
      }

    });

    if (el('recoveryMsg')) {
      el('recoveryMsg').textContent = '';
    }
  }


  /* =========================================================
     ABRIR
     ========================================================= */

  function openRecovery() {

    var modal = el('passwordRecoveryModal');

    if (!modal) {
      console.error(
        'AETERNA: no existe #passwordRecoveryModal'
      );
      return;
    }

    if (el('authModal')) {
      el('authModal').hidden = true;
    }

    modal.hidden = false;

    document.body.classList.add('modal-open');

    recovery.email = '';
    recovery.verified = false;

    if (el('recoveryEmail'))
      el('recoveryEmail').value = '';

    if (el('recoveryCode'))
      el('recoveryCode').value = '';

    if (el('recoveryPassword'))
      el('recoveryPassword').value = '';

    if (el('recoveryConfirm'))
      el('recoveryConfirm').value = '';

    clearMessages();

    showStep('email');

    setTimeout(function () {

      if (el('recoveryEmail')) {
        el('recoveryEmail').focus();
      }

    }, 100);
  }


  /* =========================================================
     CERRAR
     ========================================================= */

  function closeRecovery() {

    var modal = el('passwordRecoveryModal');

    if (!modal) return;

    modal.hidden = true;

    document.body.classList.remove('modal-open');

    recovery.email = '';
    recovery.verified = false;

    clearMessages();
  }


  /* =========================================================
     PASO 1
     ENVIAR CÓDIGO
     ========================================================= */

  async function sendCode() {

    clearMessages();

    var email =
      el('recoveryEmail')
        ? el('recoveryEmail').value.trim().toLowerCase()
        : '';

    if (!email || !email.includes('@')) {

      if (el('recoveryEmailError')) {
        el('recoveryEmailError').textContent =
          'Introduce un correo electrónico válido.';
      }

      return;
    }

    if (!window.supabaseClient) {

      if (el('recoveryMsg')) {
        el('recoveryMsg').textContent =
          'La conexión con Aeterna no está disponible.';
      }

      return;
    }

    var button = el('recoverySend');

    if (button) {
      button.disabled = true;
      button.textContent = 'Enviando…';
    }

    try {

      var response =
        await window.supabaseClient.auth.signInWithOtp({

          email: email,

          options: {
            shouldCreateUser: false
          }

        });


      if (response.error) {
        throw response.error;
      }


      recovery.email = email;


      /*
       * AQUÍ APARECE LA BARRA PARA INTRODUCIR
       * EL CÓDIGO DE 6 DÍGITOS.
       */

      if (el('recoveryCodeInfo')) {
        el('recoveryCodeInfo').textContent =
          'Enviamos un código de 6 dígitos a ' +
          email +
          '. Introdúcelo para continuar.';
      }

      if (el('recoveryCode')) {
        el('recoveryCode').value = '';
      }

      showStep('code');


      if (el('recoveryMsg')) {
        el('recoveryMsg').textContent =
          'Código enviado. Revisa tu correo.';
      }


      setTimeout(function () {

        if (el('recoveryCode')) {
          el('recoveryCode').focus();
        }

      }, 100);


    } catch (error) {

      console.error(
        'AETERNA RECOVERY:',
        error
      );

      var message =
        'No pudimos enviar el código. Inténtalo nuevamente.';

      if (
        error &&
        /rate limit/i.test(error.message || '')
      ) {
        message =
          'Has solicitado varios códigos recientemente. Espera unos minutos antes de solicitar otro.';
      }

      if (el('recoveryMsg')) {
        el('recoveryMsg').textContent = message;
      }

    } finally {

      if (button) {
        button.disabled = false;
        button.textContent = 'Enviar código';
      }

    }
  }


  /* =========================================================
     PASO 2
     VERIFICAR CÓDIGO
     ========================================================= */

  async function verifyCode() {

    clearMessages();

    var code =
      el('recoveryCode')
        ? el('recoveryCode').value
            .replace(/\D/g, '')
            .slice(0, 6)
        : '';

    if (!/^\d{6}$/.test(code)) {

      if (el('recoveryCodeError')) {
        el('recoveryCodeError').textContent =
          'Introduce los 6 dígitos del código.';
      }

      return;
    }


    if (!recovery.email) {

      showStep('email');

      return;
    }


    if (!window.supabaseClient) {

      if (el('recoveryMsg')) {
        el('recoveryMsg').textContent =
          'La conexión con Aeterna no está disponible.';
      }

      return;
    }


    var button = el('recoveryVerify');

    if (button) {
      button.disabled = true;
      button.textContent = 'Verificando…';
    }


    try {

      var response =
        await window.supabaseClient.auth.verifyOtp({

          email: recovery.email,

          token: code,

          type: 'email'

        });


      if (response.error) {
        throw response.error;
      }


      if (
        !response.data ||
        !response.data.session
      ) {
        throw new Error(
          'No se pudo crear la sesión de recuperación.'
        );
      }


      recovery.verified = true;


      /*
       * CÓDIGO CORRECTO:
       * AHORA APARECE LA PANTALLA
       * DE NUEVA CONTRASEÑA.
       */

      showStep('password');


      if (el('recoveryPassword')) {
        el('recoveryPassword').value = '';
      }

      if (el('recoveryConfirm')) {
        el('recoveryConfirm').value = '';
      }


      if (el('recoveryMsg')) {
        el('recoveryMsg').textContent =
          'Código verificado correctamente.';
      }


      setTimeout(function () {

        if (el('recoveryPassword')) {
          el('recoveryPassword').focus();
        }

      }, 100);


    } catch (error) {

      console.error(
        'AETERNA VERIFY CODE:',
        error
      );

      if (el('recoveryCodeError')) {
        el('recoveryCodeError').textContent =
          'El código no es válido o ya expiró.';
      }

    } finally {

      if (button) {
        button.disabled = false;
        button.textContent = 'Verificar código';
      }

    }
  }


  /* =========================================================
     PASO 3
     GUARDAR NUEVA CONTRASEÑA
     ========================================================= */

  async function savePassword() {

    clearMessages();


    if (!recovery.verified) {

      showStep('email');

      return;
    }


    var password =
      el('recoveryPassword')
        ? el('recoveryPassword').value
        : '';

    var confirm =
      el('recoveryConfirm')
        ? el('recoveryConfirm').value
        : '';


    if (password.length < 8) {

      if (el('recoveryPasswordError')) {
        el('recoveryPasswordError').textContent =
          'La contraseña debe tener al menos 8 caracteres.';
      }

      return;
    }


    if (password !== confirm) {

      if (el('recoveryConfirmError')) {
        el('recoveryConfirmError').textContent =
          'Las contraseñas no coinciden.';
      }

      return;
    }


    var button = el('recoverySave');

    if (button) {
      button.disabled = true;
      button.textContent = 'Guardando…';
    }


    try {

      var response =
        await window.supabaseClient.auth.updateUser({

          password: password

        });


      if (response.error) {
        throw response.error;
      }


      /*
       * Contraseña actualizada correctamente.
       */

      await window.supabaseClient.auth.signOut();


      recovery.verified = false;


      if (window.Swal) {

        await Swal.fire({

          icon: 'success',

          title: 'Contraseña actualizada',

          text:
            'Tu contraseña se cambió correctamente.',

          confirmButtonText:
            'Ir a iniciar sesión',

          confirmButtonColor:
            '#9B465D',

          background:
            '#FFFDF8',

          color:
            '#4A3036',

          allowOutsideClick:
            false

        });

      }


      closeRecovery();


      /*
       * Volvemos al login existente.
       */

      if (typeof window.authOpen === 'function') {

        window.authOpen('login');

      } else if (el('authModal')) {

        el('authModal').hidden = false;

      }


      if (el('authEmail')) {
        el('authEmail').value =
          recovery.email;
      }

      if (el('authPassword')) {
        el('authPassword').value = '';
      }


    } catch (error) {

      console.error(
        'AETERNA SAVE PASSWORD:',
        error
      );

      if (el('recoveryMsg')) {
        el('recoveryMsg').textContent =
          'No pudimos actualizar la contraseña. Inténtalo nuevamente.';
      }

    } finally {

      if (button) {
        button.disabled = false;
        button.textContent =
          'Guardar nueva contraseña';
      }

    }
  }


  /* =========================================================
     MOSTRAR / OCULTAR CONTRASEÑA
     ========================================================= */

  function passwordToggle(inputId, buttonId) {

    var input = el(inputId);
    var button = el(buttonId);

    if (!input || !button) return;

    button.addEventListener('click', function () {

      var visible =
        input.type === 'password';

      input.type =
        visible ? 'text' : 'password';

      button.textContent =
        visible ? 'Ocultar' : 'Ver';

    });
  }


  /* =========================================================
     INICIAR TODO
     ========================================================= */

  function initRecovery() {

    var forgot =
      el('forgotPassword');

    /*
     * IMPORTANTE:
     * Este botón abre NUESTRA recuperación nueva.
     */

    if (forgot) {

      forgot.addEventListener(
        'click',
        function (event) {

          event.preventDefault();
          event.stopPropagation();

          openRecovery();

        },
        true
      );

    }


    /* Formulario correo */

    var emailForm =
      el('recoveryEmailForm');

    if (emailForm) {

      emailForm.addEventListener(
        'submit',
        function (event) {

          event.preventDefault();

          sendCode();

        }
      );

    }


    /* Formulario código */

    var codeForm =
      el('recoveryCodeForm');

    if (codeForm) {

      codeForm.addEventListener(
        'submit',
        function (event) {

          event.preventDefault();

          verifyCode();

        }
      );

    }


    /* Formulario nueva contraseña */

    var passwordForm =
      el('recoveryPasswordForm');

    if (passwordForm) {

      passwordForm.addEventListener(
        'submit',
        function (event) {

          event.preventDefault();

          savePassword();

        }
      );

    }


    /* Reenviar */

    var resend =
      el('recoveryResend');

    if (resend) {

      resend.addEventListener(
        'click',
        function (event) {

          event.preventDefault();

          sendCode();

        }
      );

    }


    /* Cerrar */

    var close =
      el('recoveryClose');

    if (close) {

      close.addEventListener(
        'click',
        function (event) {

          event.preventDefault();

          closeRecovery();

        }
      );

    }


    /* Contraseñas */

    passwordToggle(
      'recoveryPassword',
      'toggleRecoveryPassword'
    );

    passwordToggle(
      'recoveryConfirm',
      'toggleRecoveryConfirm'
    );


    /* =====================================================
       HACER QUE EL CÓDIGO SOLO ACEPTE 6 DÍGITOS
       ===================================================== */

    var codeInput =
      el('recoveryCode');

    if (codeInput) {

      codeInput.addEventListener(
        'input',
        function () {

          this.value =
            this.value
              .replace(/\D/g, '')
              .slice(0, 6);

        }
      );

    }

  }


  /*
   * Esperar a que exista todo el HTML.
   */

  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      initRecovery
    );

  } else {

    initRecovery();

  }

})();