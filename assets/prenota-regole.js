/* Richiesta di preventivo o visita · Magli Caravan.
   Le domande sono quelle che Magli fa in sede a chi entra la prima volta (dal loro articolo
   «Cosa serve per acquistare un camper o una caravan»): camper o caravan, nuovo o usato,
   quanti siete, indicazione di spesa, patente, peso rimorchiabile dell'auto. */
(function () {
  var D = window.PRENOTA_DATI;
  var euro = function (n) { return '€ ' + Number(n).toLocaleString('it-IT'); };
  var BUDGET = { b1: [0, 25000], b2: [25000, 60000], b3: [60000, 90000], b4: [90000, 1e9], nd: [0, 1e9] };
  var TRAINO = { t1: 1300, t2: 1800, t3: 3500, nd: 1e9 };
  var POSTI = { p2: 2, p4: 4, p5: 5, p6: 6 };
  var V = D.veicoli.map(function (v) {
    return Object.assign({}, v, { etichette: [v.tipo + (v.cond === 'usato' ? ' usato' : ''), v.posti ? v.posti + ' posti letto' : null, v.prezzo ? euro(v.prezzo) : null, v.stato === 'pronta' ? 'Pronta consegna' : v.stato === 'venduto' ? 'Venduto' : 'Da ordinare'].filter(Boolean) });
  });
  var EXTRA = [{ id: 'consulenza', titolo: 'Non ho ancora deciso: consiglio in sede', url: null, img: null, etichette: ['Visita in concessionaria', 'Senza impegno'], extra: true }];
  window.PRENOTA = {
    sito: 'magli',
    destinatario: 'vendite@maglicaravan.it',
    gestisci: D.gestisci,
    home: D.home,
    maxProposte: 6,
    ritrovo: 'Vi aspettiamo in via Emilia 282/284 a Ozzano dell\'Emilia, il giorno __ alle ore __. Il veicolo sarà pronto da vedere.',
    chiavi: { nome: 'nome', email: 'email', telefono: 'telefono', data: 'data' },
    testi: {
      proposte: 'I modelli adatti a voi',
      nessuna: 'Con queste risposte non resta nessun modello in elenco. Allargate il budget o i posti letto, oppure scegliete il consiglio in sede: troviamo noi il veicolo, anche usato.',
      nota: 'Questa è una <strong>richiesta</strong>: vi rispondiamo per confermare il giorno della visita o mandarvi il preventivo aggiornato. I prezzi dei modelli da ordinare sono di listino 2020. Il modulo usa il servizio FormSubmit per recapitare la mail. <a href="' + D.privacy + '">Privacy</a>.',
      fattoTitolo: 'Richiesta arrivata in concessionaria',
      fatto: function (p, F, data) { return 'La richiesta per <strong>' + p.titolo + '</strong>' + (data ? ' (visita il ' + data + ')' : '') + ' è arrivata a Magli. Vi rispondiamo a ' + F.email + '. Per qualsiasi cosa: 051 798348, lunedì-sabato 9:00-12:30 e 15:00-19:00.'; },
    },
    gruppi: [
      { id: 'cosa', titolo: 'Cosa cercate', breve: 'Cerca', obbligatorio: true, opzioni: [
        { id: 'camper', nome: 'Un camper', nota: 'Van, semintegrale o motorhome' },
        { id: 'caravan', nome: 'Una caravan', nota: 'Da trainare con l\'auto' },
        { id: 'boh', nome: 'Non lo so ancora', nota: 'Ve lo consigliamo in sede' },
      ] },
      { id: 'cond', titolo: 'Nuovo o usato', breve: 'Condizione', def: 'nd', compatto: true, opzioni: [{ id: 'nuovo', nome: 'Nuovo' }, { id: 'usato', nome: 'Usato' }, { id: 'nd', nome: 'Indifferente' }] },
      { id: 'posti', titolo: 'Quanti siete', breve: 'Persone', obbligatorio: true, compatto: true, opzioni: [{ id: 'p2', nome: 'In due' }, { id: 'p4', nome: 'Tre o quattro' }, { id: 'p5', nome: 'Cinque' }, { id: 'p6', nome: 'Sei o più' }] },
      { id: 'budget', titolo: 'Quanto pensate di spendere', breve: 'Budget', def: 'nd', opzioni: [{ id: 'b1', nome: 'Fino a 25.000 €' }, { id: 'b2', nome: 'Da 25 a 60.000 €' }, { id: 'b3', nome: 'Da 60 a 90.000 €' }, { id: 'b4', nome: 'Oltre 90.000 €' }, { id: 'nd', nome: 'Non lo so' }] },
      { id: 'patente', titolo: 'Che patente avete', breve: 'Patente', def: 'B', compatto: true, se: function (S) { return S.cosa === 'camper'; }, opzioni: [{ id: 'B', nome: 'B', nota: 'Fino a 3.500 kg' }, { id: 'C', nome: 'C1 o superiore', nota: 'Anche oltre 3.500 kg' }] },
      { id: 'traino', titolo: 'Quanto può trainare la vostra auto', breve: 'Traino auto', def: 'nd', se: function (S) { return S.cosa === 'caravan'; }, opzioni: [{ id: 't1', nome: 'Fino a 1.300 kg' }, { id: 't2', nome: 'Fino a 1.800 kg' }, { id: 't3', nome: 'Oltre 1.800 kg' }, { id: 'nd', nome: 'Non lo so', nota: 'È sul libretto, alla voce F3/O' }] },
    ],
    preimposta: function (S, id) {
      var v = V.filter(function (x) { return x.id === id; })[0];
      if (!v) return;
      S.cosa = v.cat; S.cond = v.cond === 'usato' ? 'usato' : 'nd';
      S.posti = v.posti >= 6 ? 'p6' : v.posti >= 5 ? 'p5' : v.posti >= 3 ? 'p4' : 'p2';
    },
    proposte: V.concat(EXTRA),
    valuta: function (S, p) {
      var perche = [], contro = [], punti = 0;
      if (p.id === 'consulenza') { perche.push('vi facciamo vedere camper e caravan uno accanto all\'altro'); perche.push('2.400 m² coperti di showroom, lunedì-sabato'); return { perche: perche, punti: S.cosa === 'boh' ? 100 : -1 }; }
      if (p.stato === 'venduto') { contro.push('è già stato venduto'); return { contro: contro }; }
      if (S.cosa === 'camper' && p.cat !== 'camper') contro.push('è una caravan');
      if (S.cosa === 'caravan' && p.cat !== 'caravan') contro.push('è un camper');
      if (S.cond === 'nuovo' && p.cond === 'usato') contro.push('è usato');
      if (S.cond === 'usato' && p.cond !== 'usato') contro.push('è nuovo');
      var min = POSTI[S.posti] || 0;
      if (min && p.posti && p.posti < min) contro.push('ha ' + p.posti + ' posti letto');
      var b = BUDGET[S.budget || 'nd'];
      if (p.prezzo && (p.prezzo > b[1] * 1.08)) contro.push('costa ' + euro(p.prezzo) + ', oltre il budget');
      if (S.cosa === 'camper' && S.patente === 'B' && p.massa > 3500) contro.push('pesa ' + p.massa.toLocaleString('it-IT') + ' kg a pieno carico: serve la C1');
      if (S.cosa === 'caravan' && TRAINO[S.traino || 'nd'] < 1e9 && p.massa && p.massa > TRAINO[S.traino]) contro.push('pesa ' + p.massa.toLocaleString('it-IT') + ' kg carica, più di quanto traina l\'auto');
      if (contro.length) return { perche: perche, contro: contro };
      if (p.stato === 'pronta') { perche.push('è in concessionaria: si vede e si prova subito'); punti += 30; }
      if (min && p.posti >= min && p.posti <= min + 1) { perche.push(p.posti + ' posti letto, giusti per voi'); punti += 10; }
      if (p.prezzo && b[1] < 1e9 && p.prezzo >= b[0]) { if (p.prezzo <= b[1]) { perche.push('rientra nel budget: ' + euro(p.prezzo)); punti += 8; } else perche.push('poco sopra il budget: ' + euro(p.prezzo)); }
      if (S.cosa === 'camper' && S.patente === 'B' && p.massa && p.massa <= 3500) perche.push('si guida con la patente B');
      if (S.cosa === 'caravan' && p.massa && TRAINO[S.traino] < 1e9) perche.push('a pieno carico pesa ' + p.massa.toLocaleString('it-IT') + ' kg');
      if (p.lung) perche.push('lungo ' + (p.lung / 100).toFixed(2).replace('.', ',') + ' m');
      return { perche: perche, contro: contro, punti: punti - (p.prezzo || 0) / 100000 };
    },
    campi: [
      { id: 'tipo', label: 'Cosa volete fare', breve: 'Richiesta', tipo: 'select', opzioni: ['Vedere il veicolo in sede', 'Ricevere un preventivo', 'Entrambe le cose'] },
      { id: 'data', label: 'Quando passate', breve: 'Giorno della visita', tipo: 'date', min: 'oggi', nota: 'Lunedì-sabato. Se volete solo il preventivo lasciate vuoto.' },
      { id: 'momento', label: 'Momento', breve: 'Momento', tipo: 'select', opzioni: ['Indifferente', 'Mattina (9:00-12:30)', 'Pomeriggio (15:00-19:00)'] },
      { id: 'pagamento', label: 'Pagamento', breve: 'Pagamento', tipo: 'select', opzioni: ['Da valutare', 'Contanti o bonifico', 'Finanziamento'] },
      { id: 'permuta', label: 'Avete un usato in permuta', breve: 'Permuta', nota: 'Marca, modello e anno, oppure lasciate vuoto.', largo: true },
      { id: 'nome', label: 'Nome e cognome', breve: 'Nome', req: true, auto: 'name' },
      { id: 'email', label: 'Email', tipo: 'email', req: true, auto: 'email' },
      { id: 'telefono', label: 'Telefono', breve: 'Telefono', tipo: 'tel', req: true, auto: 'tel' },
      { id: 'note', label: 'Note', breve: 'Note', tipo: 'textarea', largo: true },
      { id: 'privacy', label: 'Ho letto l\'<a href="' + D.privacy + '" target="_blank">informativa privacy</a> e acconsento a essere ricontattato per questa richiesta.', tipo: 'check', req: true },
    ],
    oggetto: function (S, p, F) {
      var d = F.data ? new Date(F.data + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
      return (F.tipo === 'Ricevere un preventivo' ? 'Preventivo: ' : 'Visita: ') + p.titolo + (d ? ' · ' + d : '') + (F.pagamento === 'Finanziamento' ? ' · finanziamento' : '') + (F.permuta ? ' · permuta' : '');
    },
    autorisposta: function (p, F) {
      return 'Buongiorno ' + (F.nome || '') + ', abbiamo ricevuto la vostra richiesta per ' + p.titolo + '. Vi rispondiamo al più presto per confermare la visita o mandare il preventivo. Magli Caravan, via Emilia 282/284, Ozzano dell\'Emilia, tel. 051 798348.';
    },
    risposte: {
      conferma: function (d, x) { return { oggetto: 'Visita confermata: ' + d.p, testo: 'Buongiorno ' + (d.n || '') + ',\n\nconfermiamo la visita per ' + d.p + (x.data ? ' ' + x.data : '') + '.\n\n' + x.orario + '\n\nIndicazioni: https://www.google.com/maps/search/?api=1&query=Magli+Caravan+Ozzano\n\nA presto,\nMagli Caravan · 051 798348' }; },
      altra: function (d, x) { return { oggetto: 'La vostra richiesta: ' + d.p, testo: 'Buongiorno ' + (d.n || '') + ',\n\ngrazie per la richiesta per ' + d.p + '. Vi proponiamo ' + (x.data || '[giorno]') + '.\n\n' + x.orario + '\n\nFateci sapere se va bene.\n\nMagli Caravan · 051 798348' }; },
      no: function (d) { return { oggetto: 'La vostra richiesta: ' + d.p, testo: 'Buongiorno ' + (d.n || '') + ',\n\ngrazie per averci scritto. Il modello che cercate al momento non è disponibile: vi proponiamo di passare in sede per vedere le alternative, oppure possiamo ordinarlo.\n\nMagli Caravan · 051 798348' }; },
    },
  };
})();
