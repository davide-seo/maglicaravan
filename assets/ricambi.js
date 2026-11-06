// La bolla della richiesta ricambio.
// Invio con FormSubmit in un iframe nascosto: se l'iframe arriva alla pagina /grazie/ di questo sito
// la richiesta è partita. In ogni altro caso (servizio giù, prima attivazione, rete) si apre
// la mail già scritta e si chiede di allegare la foto: la richiesta non va mai persa.
(function () {
  var f = document.getElementById('bolla');
  if (!f) return;
  var EMAIL = f.dataset.email;
  var $ = function (s) { return f.querySelector(s); };
  var telaio = $('#telaio'), conta = $('#telaio-conta'), foto = $('#foto'), ante = $('#foto-ante');
  var invia = $('#invia'), ok = document.getElementById('esito-ok'), ko = document.getElementById('esito-ko');

  // numero di telaio: maiuscole, niente spazi, conteggio dei caratteri
  function aggiornaTelaio() {
    var v = telaio.value.toUpperCase().replace(/[\s.\-]/g, '');
    if (v !== telaio.value) { var p = telaio.selectionStart; telaio.value = v; try { telaio.setSelectionRange(p, p); } catch (e) {} }
    var n = v.length, msg = n ? n + ' di 17 caratteri' : '17 caratteri, lettere e numeri';
    if (n === 17 && /[IOQ]/.test(v)) msg = '17 caratteri. Nei numeri di telaio non ci sono le lettere I, O e Q: controlla che non siano 1 e 0.';
    else if (n > 0 && n < 17) msg += '. Sui veicoli più vecchi il numero può essere più corto: scrivilo com\'è.';
    conta.textContent = msg;
  }
  telaio.addEventListener('input', aggiornaTelaio);
  aggiornaTelaio();

  // foto: anteprima e riduzione a 1800 px, così parte anche con la rete del telefono
  var MAX = 1800;
  function mostra(file) {
    var u = URL.createObjectURL(file);
    ante.innerHTML = '<img alt="" src="' + u + '"><span>' + file.name.replace(/[<>&"]/g, '') + ' · ' + Math.max(1, Math.round(file.size / 1024)) + ' kB</span>';
  }
  foto.addEventListener('change', function () {
    var file = foto.files && foto.files[0];
    errore(foto, '');
    if (!file) { ante.innerHTML = ''; return; }
    if (!/^image\//.test(file.type)) { errore(foto, 'Scegli una foto (JPG, PNG o HEIC).'); foto.value = ''; ante.innerHTML = ''; return; }
    mostra(file);
    if (file.size < 900 * 1024 || !window.DataTransfer) return;
    var img = new Image(), u = URL.createObjectURL(file);
    img.onload = function () {
      var k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(function (b) {
        if (!b || b.size >= file.size) return;
        try {
          var dt = new DataTransfer();
          dt.items.add(new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
          foto.files = dt.files;
          mostra(foto.files[0]);
        } catch (e) {}
      }, 'image/jpeg', 0.85);
      URL.revokeObjectURL(u);
    };
    img.src = u;
  });

  function errore(el, msg) {
    var e = document.getElementById(el.id + '-errore');
    if (e) e.textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function valore(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

  function controlla() {
    var primo = null;
    function no(el, msg) { errore(el, msg); if (!primo) primo = el; }
    [telaio, $('#pezzo'), $('#nome'), $('#email'), foto, $('#consenso')].forEach(function (el) { errore(el, ''); });
    if (telaio.value.length < 5) no(telaio, 'Scrivi il numero di telaio: lo trovi sul libretto, alla lettera E.');
    if (valore('pezzo').length < 3) no($('#pezzo'), 'Scrivi quale pezzo cerchi, anche in due parole.');
    if (!foto.files || !foto.files[0]) no(foto, 'Aggiungi una foto del pezzo: è il modo più sicuro per trovare quello giusto.');
    if (valore('nome').length < 2) no($('#nome'), 'Scrivi il tuo nome.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valore('email'))) no($('#email'), 'Serve un indirizzo email valido: la risposta arriva lì.');
    if (!$('#consenso').checked) no($('#consenso'), 'Serve il consenso per poterti rispondere.');
    if (primo) primo.focus();
    return !primo;
  }

  // la mail già scritta, per il ripiego e per chi preferisce la propria posta
  function mail() {
    var righe = [
      'Buongiorno, cerco un ricambio originale Hymer.', '',
      'Numero di telaio: ' + (telaio.value || '...'),
      'Modello: ' + (valore('modello') || '...'),
      'Anno: ' + (valore('anno') || '...'),
      'Pezzo: ' + (valore('pezzo') || '...'), '',
      'Allego la foto del pezzo.', '',
      valore('nome')
    ];
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(oggetto()) + '&body=' + encodeURIComponent(righe.join('\n'));
  }
  function oggetto() { return 'Richiesta ricambio Hymer' + (telaio.value ? ' · telaio ' + telaio.value : ''); }
  document.querySelectorAll('[data-mail]').forEach(function (a) {
    a.addEventListener('click', function () { a.href = mail(); });
  });

  // invio
  var iframe = document.createElement('iframe');
  iframe.name = 'invio'; iframe.title = 'invio'; iframe.hidden = true; iframe.tabIndex = -1;
  document.body.appendChild(iframe);
  f.target = 'invio';
  var attesa = null;

  function fine(riuscito) {
    clearTimeout(attesa); attesa = null;
    iframe.onload = null;
    invia.disabled = false; invia.firstChild.nodeValue = 'Invia la richiesta ';
    if (riuscito) {
      f.hidden = true; ok.hidden = false;
      ok.querySelector('[data-mail-utente]').textContent = valore('email');
      ok.scrollIntoView({ block: 'center' }); ok.focus();
    } else {
      ko.hidden = false;
      ko.querySelector('a').href = mail();
      ko.scrollIntoView({ block: 'center' }); ko.focus();
    }
  }

  f.addEventListener('submit', function (ev) {
    if (!controlla()) { ev.preventDefault(); return; }
    ko.hidden = true;
    $('[name=_subject]').value = oggetto();
    $('[name=_next]').value = new URL('grazie/?ok=1', f.dataset.base ? new URL(f.dataset.base, location.href) : location.href).href;
    invia.disabled = true; invia.firstChild.nodeValue = 'Invio in corso ';
    iframe.onload = function () {
      var arrivato = false;
      try { arrivato = /\/grazie\//.test(iframe.contentWindow.location.pathname); } catch (e) { arrivato = false; }
      fine(arrivato);
    };
    attesa = setTimeout(function () { fine(false); }, 45000);
    // invio normale nel frame: niente preventDefault
  });

  // barra in basso sul telefono: sparisce quando la bolla è a vista
  var barra = document.querySelector('.barra'), sez = document.getElementById('richiesta');
  if (barra && sez && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { barra.classList.toggle('via', e[0].isIntersecting); }, { rootMargin: '0px 0px -30% 0px' }).observe(sez);
  }
})();
