/* Richiesta di prenotazione a due tempi: qualifica, proposte con il perché, dettagli, invio.
   La mail parte con FormSubmit e contiene il link alla pagina «gestisci», da cui le guide
   accettano, propongono un'altra data o rifiutano con una risposta già scritta.
   Il motore è uguale per i due siti: regole, testi e campi stanno in window.PRENOTA. */
(function () {
  'use strict';
  var C = window.PRENOTA;
  if (!C) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var dataLunga = function (iso) { if (!iso) return ''; var d = new Date(iso + 'T12:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
  var b64 = function (o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  var unb64 = function (s) { return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))); };
  var tel = function (t) { var n = String(t || '').replace(/[^\d+]/g, ''); if (!n) return ''; if (n.indexOf('+') === 0) return n.slice(1); if (n.indexOf('00') === 0) return n.slice(2); return '39' + n; };
  var mailto = function (to, oggetto, testo) { return 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(oggetto) + '&body=' + encodeURIComponent(testo); };

  /* ---------- pagina «gestisci» per le guide ---------- */
  var G = document.getElementById('gestisci');
  if (G) {
    var d;
    try { d = unb64(location.hash.slice(1)); } catch (e) { d = null; }
    if (!d) { G.innerHTML = '<p class="pren-avviso">Questo link non contiene una richiesta. Si apre dalla mail di prenotazione.</p>'; return; }
    var righe = (d.r || []).map(function (kv) { return '<div><dt>' + esc(kv[0]) + '</dt><dd>' + esc(kv[1]) + '</dd></div>'; }).join('');
    G.innerHTML =
      '<section class="pren-blocco"><h2>La richiesta</h2><dl class="pren-riep">' + righe + '</dl>' +
      (d.t ? '<p class="pren-azioni-mini"><a class="btn btn--ghost btn--piccolo" href="tel:+' + esc(tel(d.t)) + '">Chiama ' + esc(d.t) + '</a> <a class="btn btn--ghost btn--piccolo" href="https://wa.me/' + esc(tel(d.t)) + '">WhatsApp</a></p>' : '') + '</section>' +
      '<section class="pren-blocco"><h2>Rispondi</h2>' +
      '<div class="pren-campi"><label class="pren-campo"><span>Orario e ritrovo da comunicare</span><input id="g-orario" type="text" value="' + esc(C.ritrovo || '') + '"></label>' +
      '<label class="pren-campo"><span>Data da proporre (solo se cambi data)</span><input id="g-data" type="date"></label></div>' +
      '<div class="pren-scelte pren-scelte--3" role="radiogroup" aria-label="Tipo di risposta">' +
      '<button type="button" class="pren-opz attiva" data-r="conferma" aria-pressed="true"><strong>Accetta</strong><span>Conferma data e orario</span></button>' +
      '<button type="button" class="pren-opz" data-r="altra" aria-pressed="false"><strong>Altra data</strong><span>Proponi un giorno diverso</span></button>' +
      '<button type="button" class="pren-opz" data-r="no" aria-pressed="false"><strong>Non possiamo</strong><span>Rifiuta con garbo</span></button></div>' +
      '<label class="pren-campo"><span>Testo della mail, modificabile</span><textarea id="g-testo" rows="14"></textarea></label>' +
      '<div class="azioni"><a id="g-invia" class="btn" href="#">Apri la mail per ' + esc(d.n || 'il cliente') + '</a><button id="g-copia" type="button" class="btn btn--ghost">Copia il testo</button></div>' +
      '<p class="pren-nota">La mail parte dalla vostra casella, così il cliente risponde direttamente a voi.</p></section>';
    var tipo = 'conferma';
    var aggiorna = function () {
      var r = C.risposte[tipo](d, { orario: document.getElementById('g-orario').value, data: dataLunga(document.getElementById('g-data').value) });
      document.getElementById('g-testo').value = r.testo;
      document.getElementById('g-invia').setAttribute('data-oggetto', r.oggetto);
      document.getElementById('g-invia').href = mailto(d.e, r.oggetto, r.testo);
    };
    G.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-r]');
      if (b) { tipo = b.getAttribute('data-r'); G.querySelectorAll('[data-r]').forEach(function (x) { x.classList.toggle('attiva', x === b); x.setAttribute('aria-pressed', x === b); }); aggiorna(); }
      if (ev.target.id === 'g-copia') { navigator.clipboard && navigator.clipboard.writeText(document.getElementById('g-testo').value); ev.target.textContent = 'Copiato'; }
    });
    G.addEventListener('input', function (ev) {
      if (ev.target.id === 'g-testo') { var a = document.getElementById('g-invia'); a.href = mailto(d.e, a.getAttribute('data-oggetto'), ev.target.value); }
      else aggiorna();
    });
    aggiorna();
    return;
  }

  /* ---------- modulo di richiesta ---------- */
  var R = document.getElementById('prenota');
  if (!R) return;
  var qs = new URLSearchParams(location.search);
  var S = {}, F = {};
  C.gruppi.forEach(function (g) { S[g.id] = g.multi ? (g.def || []).slice() : (g.def == null ? null : g.def); });
  var scelta = null;
  var pre = qs.get('p');
  if (pre && C.proposte.some(function (p) { return p.id === pre; })) { scelta = pre; if (C.preimposta) C.preimposta(S, pre); }
  var oggi = new Date();

  R.innerHTML =
    '<form id="pren-form" novalidate>' +
    '<section class="pren-blocco"><p class="pren-passo">1 di 3</p><h2>Raccontateci chi siete</h2><div id="pren-gruppi"></div></section>' +
    '<section class="pren-blocco" id="pren-proposte-b"><p class="pren-passo">2 di 3</p><h2>' + esc(C.testi.proposte) + '</h2><div id="pren-proposte" aria-live="polite"></div></section>' +
    '<section class="pren-blocco" id="pren-dettagli-b" hidden><p class="pren-passo">3 di 3</p><h2>I dettagli della richiesta</h2><div id="pren-campi" class="pren-campi"></div>' +
    '<div class="pren-riepilogo"><h3>Riepilogo</h3><dl class="pren-riep" id="pren-riep"></dl></div>' +
    '<input type="text" name="_honey" id="pren-honey" tabindex="-1" autocomplete="off" class="pren-miele" aria-hidden="true">' +
    '<p class="pren-nota">' + C.testi.nota + '</p>' +
    '<div class="azioni"><button class="btn" type="submit" id="pren-invia">Invia la richiesta</button></div>' +
    '<div id="pren-esito" aria-live="assertive"></div></section>' +
    '</form>';

  var gruppiEl = document.getElementById('pren-gruppi');
  var proposteEl = document.getElementById('pren-proposte');
  var dettB = document.getElementById('pren-dettagli-b');
  var campiEl = document.getElementById('pren-campi');

  function etichetta(g, id) { var o = g.opzioni.filter(function (x) { return x.id === id; })[0]; return o ? o.nome : ''; }
  function visibile(g) { return !g.se || g.se(S); }

  function disegnaGruppi() {
    gruppiEl.innerHTML = C.gruppi.map(function (g) {
      if (!visibile(g)) return '';
      return '<fieldset class="pren-gruppo"><legend>' + esc(g.titolo) + (g.multi ? ' <small>anche più di una</small>' : '') + '</legend>' +
        '<div class="pren-scelte' + (g.compatto ? ' pren-scelte--compatte' : '') + '">' + g.opzioni.map(function (o) {
          var on = g.multi ? S[g.id].indexOf(o.id) > -1 : S[g.id] === o.id;
          return '<button type="button" class="pren-opz' + (on ? ' attiva' : '') + '" aria-pressed="' + on + '" data-g="' + g.id + '" data-o="' + esc(o.id) + '"><strong>' + esc(o.nome) + '</strong>' + (o.nota ? '<span>' + esc(o.nota) + '</span>' : '') + '</button>';
        }).join('') + '</div></fieldset>';
    }).join('');
  }

  function valuta() {
    return C.proposte.map(function (p) { var v = C.valuta(S, p, oggi); return { p: p, perche: v.perche || [], contro: v.contro || [], punti: v.punti || 0 }; });
  }

  function disegnaProposte() {
    var mancano = C.gruppi.filter(function (g) { return visibile(g) && g.obbligatorio && (g.multi ? !S[g.id].length : !S[g.id]); });
    if (mancano.length) {
      proposteEl.innerHTML = '<p class="pren-vuoto">Rispondete a «' + esc(mancano[0].titolo.toLowerCase()) + '» e qui compaiono le proposte adatte a voi.</p>';
      return;
    }
    var tutte = valuta();
    var ok = tutte.filter(function (x) { return !x.contro.length; }).sort(function (a, b) { return (b.p.id === scelta) - (a.p.id === scelta) || b.punti - a.punti; });
    var ko = tutte.filter(function (x) { return x.contro.length; });
    var nascosti = 0, koTot = ko.length;
    if (C.maxProposte && ok.length > C.maxProposte) { nascosti = ok.length - C.maxProposte; ok = ok.slice(0, C.maxProposte); }
    if (ko.length > 8) ko = ko.slice(0, 8);
    var card = function (x, i) {
      var on = scelta === x.p.id;
      return '<label class="pren-prop' + (on ? ' attiva' : '') + (i === 0 ? ' pren-prop--prima' : '') + '">' +
        '<input type="radio" name="proposta" value="' + esc(x.p.id) + '"' + (on ? ' checked' : '') + '>' +
        (x.p.img ? '<span class="pren-prop-img"><img src="' + esc(x.p.img) + '" alt="" loading="lazy" width="320" height="200"></span>' : '') +
        '<span class="pren-prop-body">' + (i === 0 ? '<em class="pren-badge">La più adatta</em>' : '') +
        '<strong>' + esc(x.p.titolo) + '</strong>' +
        (x.p.etichette ? '<span class="etichette">' + x.p.etichette.map(function (e) { return '<em>' + esc(e) + '</em>'; }).join('') + '</span>' : '') +
        '<ul>' + x.perche.slice(0, 3).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        (x.p.url ? '<a class="pren-prop-link" href="' + esc(x.p.url) + '" target="_blank" rel="noopener">Leggi la pagina</a>' : '') +
        '<span class="pren-prop-cta">' + (on ? 'Scelta' : 'Scegli questa') + '</span></span></label>';
    };
    proposteEl.innerHTML =
      (ok.length ? '<div class="pren-props" role="radiogroup" aria-label="Proposte">' + ok.map(card).join('') + '</div>' : '<p class="pren-vuoto">' + esc(C.testi.nessuna) + '</p>') +
      (nascosti ? '<p class="pren-nota">E altri ' + nascosti + ' modelli adatti: restringete le risposte o chiedete il consiglio in sede.</p>' : '') + (ko.length ? '<details class="pren-ko"><summary>Non adatte a quello che avete indicato (' + koTot + '), e perché</summary><ul>' + ko.map(function (x) { return '<li><strong>' + esc(x.p.titolo) + '</strong>: ' + esc(x.contro[0]) + (x.p.url ? ' · <a href="' + esc(x.p.url) + '" target="_blank" rel="noopener">pagina</a>' : '') + '</li>'; }).join('') + '</ul></details>' : '');
    if (scelta && !ok.some(function (x) { return x.p.id === scelta; }) && !(nascosti && tutte.some(function (x) { return x.p.id === scelta && !x.contro.length; }))) {
      var k = ko.filter(function (x) { return x.p.id === scelta; })[0];
      if (k) proposteEl.insertAdjacentHTML('afterbegin', '<p class="pren-avviso">La proposta che avevate scelto, ' + esc(k.p.titolo) + ', non va bene con le risposte nuove: ' + esc(k.contro[0]) + '.</p>');
      scelta = null;
    }
  }

  function proposta() { return C.proposte.filter(function (p) { return p.id === scelta; })[0]; }

  function disegnaCampi() {
    if (!scelta) { dettB.hidden = true; return; }
    dettB.hidden = false;
    var p = proposta();
    campiEl.innerHTML = C.campi.map(function (c) {
      var v = F[c.id] != null ? F[c.id] : (typeof c.def === 'function' ? c.def(S, p) : (c.def || ''));
      if (c.tipo === 'select' && !v) { var ops = typeof c.opzioni === 'function' ? c.opzioni(S, p) : c.opzioni; v = ops[0]; }
      F[c.id] = v;
      var req = c.req ? ' required' : '';
      var nota = c.nota ? '<small>' + c.nota + '</small>' : '';
      var inp;
      if (c.tipo === 'textarea') inp = '<textarea name="' + c.id + '" rows="3"' + req + '>' + esc(v) + '</textarea>';
      else if (c.tipo === 'select') inp = '<select name="' + c.id + '"' + req + '>' + (typeof c.opzioni === 'function' ? c.opzioni(S, p) : c.opzioni).map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
      else if (c.tipo === 'check') return '<label class="pren-campo pren-check" data-c="' + c.id + '"><input type="checkbox" name="' + c.id + '"' + (v ? ' checked' : '') + req + '><span>' + c.label + '</span></label>';
      else inp = '<input name="' + c.id + '" type="' + (c.tipo || 'text') + '" value="' + esc(v) + '"' + req + (c.min != null ? ' min="' + (c.min === 'oggi' ? new Date().toISOString().slice(0, 10) : c.min) + '"' : '') + (c.max != null ? ' max="' + c.max + '"' : '') + (c.auto ? ' autocomplete="' + c.auto + '"' : '') + (c.tipo === 'number' ? ' inputmode="numeric"' : '') + '>';
      return '<label class="pren-campo' + (c.largo ? ' pren-campo--largo' : '') + '" data-c="' + c.id + '"><span>' + esc(c.label) + (c.req ? ' <b aria-hidden="true">*</b>' : '') + '</span>' + inp + nota + '</label>';
    }).join('');
    aggiornaCampi();
  }

  function aggiornaCampi() {
    var p = proposta();
    C.campi.forEach(function (c) {
      var box = campiEl.querySelector('[data-c="' + c.id + '"]');
      if (!box) return;
      var on = !c.se || c.se(S, p, F);
      box.hidden = !on;
      box.querySelectorAll('input,select,textarea').forEach(function (i) { i.disabled = !on; });
    });
    riepilogo();
  }

  function righe() {
    var p = proposta();
    var r = [['Proposta', p ? p.titolo : '']];
    C.gruppi.forEach(function (g) {
      if (!visibile(g)) return;
      var v = g.multi ? S[g.id].map(function (id) { return etichetta(g, id); }).join(', ') : etichetta(g, S[g.id]);
      if (v) r.push([g.breve || g.titolo, v]);
    });
    C.campi.forEach(function (c) {
      var box = campiEl.querySelector('[data-c="' + c.id + '"]');
      if (!box || box.hidden || c.tipo === 'check') return;
      var v = F[c.id];
      if (v === '' || v == null) return;
      r.push([c.breve || c.label, c.tipo === 'date' ? dataLunga(v) : String(v)]);
    });
    return r;
  }

  function riepilogo() {
    document.getElementById('pren-riep').innerHTML = righe().map(function (kv) { return '<div><dt>' + esc(kv[0]) + '</dt><dd>' + esc(kv[1]) + '</dd></div>'; }).join('');
  }

  function tutto() { disegnaGruppi(); disegnaProposte(); disegnaCampi(); }

  R.addEventListener('click', function (ev) {
    var b = ev.target.closest('.pren-opz');
    if (!b || !b.getAttribute('data-g')) return;
    var g = C.gruppi.filter(function (x) { return x.id === b.getAttribute('data-g'); })[0];
    var o = b.getAttribute('data-o');
    if (g.multi) { var i = S[g.id].indexOf(o); if (i > -1) S[g.id].splice(i, 1); else S[g.id].push(o); }
    else S[g.id] = o;
    tutto();
  });
  R.addEventListener('change', function (ev) {
    if (ev.target.name === 'proposta') { scelta = ev.target.value; disegnaProposte(); disegnaCampi(); dettB.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (ev.target.closest('#pren-campi')) { F[ev.target.name] = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value; aggiornaCampi(); }
  });
  R.addEventListener('input', function (ev) {
    if (ev.target.closest('#pren-campi') && ev.target.type !== 'checkbox') { F[ev.target.name] = ev.target.value; aggiornaCampi(); }
  });

  document.getElementById('pren-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var form = ev.target;
    if (!scelta) { proposteEl.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!form.reportValidity()) return;
    if (document.getElementById('pren-honey').value) return;
    var p = proposta();
    var r = righe();
    var dati = { s: C.sito, p: p.titolo, n: F[C.chiavi.nome], e: F[C.chiavi.email], t: F[C.chiavi.telefono], d: F[C.chiavi.data], r: r };
    var link = C.gestisci + '#' + b64(dati);
    var oggetto = C.oggetto(S, p, F);
    var corpo = {};
    r.forEach(function (kv) { corpo[kv[0]] = kv[1]; });
    C.campi.forEach(function (c) { if (c.id === C.chiavi.email) delete corpo[c.breve || c.label]; });
    corpo['Gestisci la richiesta'] = link;
    corpo._subject = oggetto;
    corpo._template = 'table';
    corpo._captcha = 'false';
    corpo.email = F[C.chiavi.email];
    corpo._replyto = F[C.chiavi.email];
    corpo._autoresponse = C.autorisposta(p, F, dataLunga(F[C.chiavi.data]));
    var bottone = document.getElementById('pren-invia');
    var esito = document.getElementById('pren-esito');
    var testoMail = r.map(function (kv) { return kv[0] + ': ' + kv[1]; }).join('\n') + '\n\nGestisci la richiesta: ' + link;
    var ripiego = '<p>Potete anche mandarla con la vostra posta: <a href="' + esc(mailto(C.destinatario, oggetto, testoMail)) + '">apri la mail già scritta</a>.</p>';
    bottone.disabled = true; bottone.textContent = 'Invio in corso…';
    fetch('https://formsubmit.co/ajax/' + C.destinatario, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(corpo) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (x) {
        if (x.ok && String(x.j.success) === 'true') {
          R.innerHTML = '<section class="pren-blocco pren-fatto"><p class="pren-passo">Richiesta inviata</p><h2>' + esc(C.testi.fattoTitolo) + '</h2>' +
            '<p>' + C.testi.fatto(p, F, dataLunga(F[C.chiavi.data])) + '</p><dl class="pren-riep">' + r.map(function (kv) { return '<div><dt>' + esc(kv[0]) + '</dt><dd>' + esc(kv[1]) + '</dd></div>'; }).join('') + '</dl>' +
            '<div class="azioni"><a class="btn btn--ghost" href="' + esc(C.home) + '">Torna al sito</a></div></section>';
          R.scrollIntoView({ behavior: 'smooth' });
        } else {
          bottone.disabled = false; bottone.textContent = 'Invia la richiesta';
          esito.innerHTML = '<div class="pren-avviso"><p><strong>La richiesta non è partita.</strong> ' + esc((x.j && x.j.message) || 'Il servizio di invio non ha risposto.') + '</p>' + ripiego + '</div>';
        }
      })
      .catch(function () {
        bottone.disabled = false; bottone.textContent = 'Invia la richiesta';
        esito.innerHTML = '<div class="pren-avviso"><p><strong>Connessione assente o servizio non raggiungibile.</strong></p>' + ripiego + '</div>';
      });
  });

  tutto();
  if (scelta) setTimeout(function () { proposteEl.scrollIntoView({ block: 'start' }); }, 50);
})();
