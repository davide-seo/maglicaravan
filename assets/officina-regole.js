/* Prenotazione dell'officina · Magli Caravan. I campi vengono dal vecchio modulo dell'officina:
   marca e modello, numero di serie, numero di telaio, servizio, quando. */
(function () {
  var D = window.PRENOTA_DATI;
  var S_ = function (id, titolo, nota) { return { id: id, titolo: titolo, url: null, img: null, etichette: [nota] }; };
  window.PRENOTA = {
    sito: 'magli-officina',
    destinatario: 'vendite@maglicaravan.it',
    gestisci: D.gestisci, home: D.home,
    ritrovo: 'Appuntamento in officina il giorno __ alle ore __, via Emilia 282/284, Ozzano dell\'Emilia. Portate il libretto del veicolo.',
    chiavi: { nome: 'nome', email: 'email', telefono: 'telefono', data: 'data' },
    testi: {
      proposte: 'Che intervento serve',
      nessuna: 'Scegliete il tipo di veicolo.',
      nota: 'Questa è una <strong>richiesta</strong>: l\'officina vi richiama per confermare giorno e ora. Lunedì-venerdì 9:00-12:30 e 15:00-19:00. Il modulo usa il servizio FormSubmit per recapitare la mail. <a href="' + D.privacy + '">Privacy</a>.',
      fattoTitolo: 'Richiesta arrivata in officina',
      fatto: function (p, F) { return 'La richiesta per <strong>' + p.titolo + '</strong> è arrivata. Vi richiamiamo al ' + (F.telefono || 'numero indicato') + ' per fissare l\'appuntamento.'; },
    },
    gruppi: [
      { id: 'veicolo', titolo: 'Che veicolo avete', breve: 'Veicolo', obbligatorio: true, opzioni: [{ id: 'camper', nome: 'Camper', nota: 'Semintegrale, motorhome, mansardato' }, { id: 'van', nome: 'Furgonato o van' }, { id: 'caravan', nome: 'Caravan' }] },
    ],
    proposte: [
      S_('tagliando', 'Tagliando di impermeabilità', 'Controllo infiltrazioni'), S_('gas', 'Controllo impianto gas', 'Sicurezza'), S_('riparazione', 'Riparazione', 'Carrozzeria, impianti, mobilio'),
      S_('solare', 'Pannelli solari', 'Installazione'), S_('antenne', 'Antenne satellitari e terrestri', 'Installazione'), S_('cristalli', 'Cristalli e parabrezza', 'Anche su motorhome Hymer di ogni anno'),
      S_('generatore', 'Generatore di corrente', 'Montaggio'), S_('portabici', 'Portabici e portamoto', 'Montaggio'), S_('revisione', 'Preparazione alla revisione', 'Freni, fanali, giunti per caravan e rimorchi'), S_('clima', 'Aria condizionata', 'Installazione'),
    ],
    valuta: function (S, p) {
      var perche = [], contro = [];
      if (p.id === 'revisione' && S.veicolo !== 'caravan') contro.push('è il controllo per caravan e rimorchi');
      if (p.id === 'cristalli' && S.veicolo === 'caravan') contro.push('riguarda il parabrezza dei camper');
      if (p.id === 'cristalli') perche.push('ordiniamo da Hymer il cristallo giusto per anno e modello, con preventivo per l\'assicurazione');
      if (p.id === 'revisione') perche.push('dal 2018 anche le caravan hanno l\'obbligo di revisione');
      if (p.id === 'tagliando') perche.push('da fare ogni anno per la garanzia sulle infiltrazioni');
      return { perche: perche, contro: contro, punti: p.id === 'tagliando' ? 5 : 0 };
    },
    campi: [
      { id: 'modello', label: 'Marca e modello', breve: 'Marca e modello', req: true },
      { id: 'anno', label: 'Anno', breve: 'Anno', tipo: 'number', min: 1970, max: 2030 },
      { id: 'serie', label: 'Numero di serie', breve: 'Numero di serie', nota: 'Sull\'etichetta lato passeggero o all\'interno.' },
      { id: 'telaio', label: 'Numero di telaio', breve: 'Telaio', nota: 'Sul libretto, alla voce E.' },
      { id: 'data', label: 'Giorno che preferite', breve: 'Giorno', tipo: 'date', min: 'oggi' },
      { id: 'momento', label: 'Momento', breve: 'Momento', tipo: 'select', opzioni: ['Indifferente', 'Mattina (9:00-12:30)', 'Pomeriggio (15:00-19:00)'] },
      { id: 'nome', label: 'Nome e cognome', breve: 'Nome', req: true, auto: 'name' },
      { id: 'email', label: 'Email', tipo: 'email', req: true, auto: 'email' },
      { id: 'telefono', label: 'Telefono', breve: 'Telefono', tipo: 'tel', req: true, auto: 'tel' },
      { id: 'note', label: 'Descrivete il problema', breve: 'Problema', tipo: 'textarea', largo: true },
      { id: 'privacy', label: 'Ho letto l\'<a href="' + D.privacy + '" target="_blank">informativa privacy</a> e acconsento a essere ricontattato.', tipo: 'check', req: true },
    ],
    oggetto: function (S, p, F) { return 'Officina: ' + p.titolo + ' · ' + (F.modello || S.veicolo) + (F.data ? ' · ' + new Date(F.data + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : ''); },
    autorisposta: function (p, F) { return 'Buongiorno ' + (F.nome || '') + ', l\'officina Magli ha ricevuto la richiesta per ' + p.titolo + '. Vi richiamiamo per fissare l\'appuntamento. Tel. 051 798348.'; },
    risposte: {
      conferma: function (d, x) { return { oggetto: 'Appuntamento in officina: ' + d.p, testo: 'Buongiorno ' + (d.n || '') + ',\n\nconfermiamo l\'appuntamento per ' + d.p + (x.data ? ' ' + x.data : '') + '.\n\n' + x.orario + '\n\nOfficina Magli · 051 798348' }; },
      altra: function (d, x) { return { oggetto: 'Officina: ' + d.p, testo: 'Buongiorno ' + (d.n || '') + ',\n\nper ' + d.p + ' possiamo proporvi ' + (x.data || '[giorno]') + '.\n\n' + x.orario + '\n\nOfficina Magli · 051 798348' }; },
      no: function (d) { return { oggetto: 'Officina: ' + d.p, testo: 'Buongiorno ' + (d.n || '') + ',\n\ngrazie per la richiesta. Per ' + d.p + ' vi chiediamo di chiamarci al 051 798348 per valutare insieme l\'intervento.\n\nOfficina Magli' }; },
    },
  };
})();
