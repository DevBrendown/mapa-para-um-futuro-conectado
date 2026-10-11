(function () {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hd = document.getElementById('top');
    function sc() { hd.classList.toggle('sc', scrollY > 30) }
    addEventListener('scroll', sc, { passive: true }); sc();

    var dl = document.getElementById('dl'), msg = document.getElementById('msg');
    if (dl && msg) { var old = msg.textContent; dl.addEventListener('click', function () { msg.textContent = 'Baixando o PDF... se não abrir, verifique a pasta de downloads.'; setTimeout(function () { msg.textContent = old }, 5000) }) }

    var pf = document.getElementById('pf'), full = pf ? pf.textContent : '', typed = false;
    function typeIt() {
        if (typed || reduce || !pf) return; typed = true; pf.textContent = ''; pf.classList.add('type'); var i = 0;
        (function step() { pf.textContent = full.slice(0, ++i); if (i < full.length) setTimeout(step, 14); else pf.classList.remove('type') })();
    }
    function count(el) {
        var to = +el.getAttribute('data-count'); if (reduce) { el.textContent = to; return }
        var t0 = null; function f(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 1400, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f) } requestAnimationFrame(f);
    }
    var rvs = document.querySelectorAll('.rv');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.classList.add('in'); io.unobserve(e.target);
                if (e.target.querySelector && e.target.querySelector('#pf')) typeIt();
                e.target.querySelectorAll && e.target.querySelectorAll('[data-count]').forEach(count);
                if (e.target.matches && e.target.matches('.stats li')) e.target.querySelectorAll('[data-count]').forEach(count);
            })
        }, { threshold: .2 });
        rvs.forEach(function (r) { io.observe(r) });
    } else { rvs.forEach(function (r) { r.classList.add('in') }); document.querySelectorAll('[data-count]').forEach(function (c) { c.textContent = c.getAttribute('data-count') }) }

    var cp = document.getElementById('cp');
    if (cp) cp.addEventListener('click', function () {
        var t = full, o = cp.textContent;
        function ok() { cp.textContent = 'Copiado!'; setTimeout(function () { cp.textContent = o }, 1800) }
        if (navigator.clipboard) { navigator.clipboard.writeText(t).then(ok, function () { }) }
        else { var x = document.createElement('textarea'); x.value = t; document.body.appendChild(x); x.select(); document.execCommand('copy'); x.remove(); ok() }
    });

    var mq = document.getElementById('marq');
    if (mq && !reduce) {
        var trk = mq.querySelector('.trk');
        [].slice.call(trk.children).forEach(function (a) { var c = a.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; trk.appendChild(c) });
        mq.classList.add('go');
    }

    /* contadores regressivos (horario de Brasilia): cada .cd tem data-start, data-end, data-during e data-after */
    function pad(n) { return n < 10 ? '0' + n : '' + n }
    document.querySelectorAll('.cd').forEach(function (cd) {
        var start = new Date(cd.getAttribute('data-start')).getTime(), end = new Date(cd.getAttribute('data-end')).getTime();
        var T = cd.querySelector('.cdt'), U = {};
        cd.querySelectorAll('[data-u]').forEach(function (e) { U[e.getAttribute('data-u')] = e });
        var iv;
        function tick() {
            var now = Date.now(), ms = start - now;
            if (ms <= 0) {
                cd.classList.add('done');
                T.textContent = cd.getAttribute(now < end ? 'data-during' : 'data-after');
                if (now >= end && iv) clearInterval(iv);
                return;
            }
            var s = Math.floor(ms / 1000);
            U.d.textContent = Math.floor(s / 86400); U.h.textContent = pad(Math.floor(s % 86400 / 3600)); U.m.textContent = pad(Math.floor(s % 3600 / 60)); U.s.textContent = pad(s % 60);
        }
        iv = setInterval(tick, 1000); tick();
    });

    /* gerador de prompt */
    var g = { papel: 'g-papel', ctx: 'g-ctx', tarefa: 'g-tarefa', fmt: 'g-fmt', crit: 'g-crit' }, out = document.getElementById('g-out');
    if (out) {
        var empty = out.textContent;
        function val(k) { return document.getElementById(g[k]).value.trim() }
        function dot(s) { return /[.!?]$/.test(s) ? s : s + '.' }
        function build() {
            var a = [];
            if (val('papel')) a.push('Atue como ' + dot(val('papel')));
            if (val('ctx')) a.push('Contexto: ' + dot(val('ctx')));
            if (val('tarefa')) a.push('Tarefa: ' + dot(val('tarefa')));
            if (val('fmt')) a.push('Formato da resposta: ' + dot(val('fmt')));
            if (val('crit')) a.push('Critério: ' + dot(val('crit')));
            out.textContent = a.length ? a.join('\n') : empty;
            return a.length > 0;
        }
        Object.keys(g).forEach(function (k) { document.getElementById(g[k]).addEventListener('input', build) });
        var ex = { papel: 'professor de Redação do ENEM', ctx: 'Sou aluno do 3º ano e vou fazer o ENEM em novembro', tarefa: 'Corrija minha redação pelas 5 competências', fmt: 'Tabela com nota de 0 a 200 por competência e 3 melhorias', crit: 'Seja direto, sem elogios vazios, e cite o trecho que preciso corrigir' };
        document.getElementById('g-ex').addEventListener('click', function () { Object.keys(ex).forEach(function (k) { document.getElementById(g[k]).value = ex[k] }); build() });
        document.getElementById('g-clr').addEventListener('click', function () { Object.keys(g).forEach(function (k) { document.getElementById(g[k]).value = '' }); build() });
        var gc = document.getElementById('g-copy');
        gc.addEventListener('click', function () {
            if (!build()) { out.textContent = 'Preencha pelo menos um campo antes de copiar.'; return }
            var t = out.textContent, o = gc.textContent;
            function ok() { gc.textContent = 'Copiado!'; setTimeout(function () { gc.textContent = o }, 1800) }
            if (navigator.clipboard) { navigator.clipboard.writeText(t).then(ok, function () { }) }
            else { var x = document.createElement('textarea'); x.value = t; document.body.appendChild(x); x.select(); document.execCommand('copy'); x.remove(); ok() }
        });
    }
})();

/* ===== Formulario de avaliacao (envia para o Google Forms) =====
   1) Crie o formulario no Google Forms com as perguntas na mesma ordem.
   2) Troque o ID do formulario e os numeros entry.XXXX abaixo. */
(function () {
    var FORM = {
        action: 'https://docs.google.com/forms/d/e/1FAIpQLSfKlELKPj3CKCAERedb18cp5t_FyahkIgXcAD8atlxq1U2MHQ/formResponse',
        view: 'https://docs.google.com/forms/d/e/1FAIpQLSfKlELKPj3CKCAERedb18cp5t_FyahkIgXcAD8atlxq1U2MHQ/viewform',
        entry: { nome: 'entry.132988416', serie: 'entry.473716952', geral: 'entry.764932699', clareza: 'entry.1491454430', util: 'entry.1041536757', material: 'entry.57506078', partes: 'entry.2013443997', uso: 'entry.972411117', gostou: 'entry.1434813516', melhorar: 'entry.1312681789' }
    };
    var f = document.getElementById('aval'); if (!f) return;
    var st = document.getElementById('aval-st'), btn = document.getElementById('aval-btn'), lk = document.getElementById('aval-link');
    var ready = FORM.action.indexOf('SEU_FORM_ID') === -1;
    if (ready) { lk.href = FORM.view; lk.hidden = false }
    function say(t, c) { st.textContent = t; st.className = 'fst ' + (c || '') }
    f.addEventListener('submit', function (e) {
        e.preventDefault();
        var bad = [];
        f.querySelectorAll('.rt[data-req]').forEach(function (fs) {
            var n = fs.getAttribute('data-req'), ok = !!f.querySelector('input[name="' + n + '"]:checked');
            fs.classList.toggle('bad', !ok); if (!ok) bad.push(fs);
        });
        var nome = f.elements.nome.value.trim(), serie = f.elements.serie.value;
        if (!nome || !serie || bad.length) {
            say('Preencha seu nome, a série e turma e as 4 notas (estrelas) para enviar.', 'err');
            if (!nome) f.elements.nome.focus(); else if (!serie) f.elements.serie.focus();
            return;
        }
        if (!ready) { console.warn('Configure FORM.action e os entry.XXXX no script.js'); say('O formulário ainda está sendo configurado. Tente novamente mais tarde.', 'err'); return }
        var d = new URLSearchParams();
        d.append(FORM.entry.nome, nome); d.append(FORM.entry.serie, serie);
        ['geral', 'clareza', 'util', 'material'].forEach(function (n) { d.append(FORM.entry[n], f.querySelector('input[name="' + n + '"]:checked').value) });
        f.querySelectorAll('input[name="partes"]:checked').forEach(function (c) { d.append(FORM.entry.partes, c.value) });
        var uso = f.querySelector('input[name="uso"]:checked'); if (uso) d.append(FORM.entry.uso, uso.value);
        if (f.elements.gostou.value.trim()) d.append(FORM.entry.gostou, f.elements.gostou.value.trim());
        if (f.elements.melhorar.value.trim()) d.append(FORM.entry.melhorar, f.elements.melhorar.value.trim());
        btn.disabled = true; say('Enviando...', '');
        fetch(FORM.action, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: d.toString() })
            .then(function () { say('Obrigado pela sua avaliação!', 'ok'); f.reset(); f.querySelectorAll('.rt').forEach(function (x) { x.classList.remove('bad') }) })
            .catch(function () { say('Não foi possível enviar agora. Verifique sua internet e tente de novo.', 'err') })
            .then(function () { btn.disabled = false });
    });
    f.addEventListener('change', function (e) { var fs = e.target.closest && e.target.closest('.rt'); if (fs) fs.classList.remove('bad') });
})();