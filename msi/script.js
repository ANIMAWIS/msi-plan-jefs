(function(){
    const WA_NUM = '5575991616161'; // Brasil country code +55
    const modal = document.getElementById('orderModal');
    const form = document.getElementById('orderForm');
    const planField = document.getElementById('planField');
    const nameField = document.getElementById('nameField');
    const addressField = document.getElementById('addressField');
    const phoneField = document.getElementById('phoneField');
    const cancelBtn = document.getElementById('cancelOrder');
    // order log elements
    let orderLogSection;
    let orderLogPre;
    let btnDownload;
    let btnClear;

    function ensureLogElements(){
        if(orderLogSection) return;
        orderLogSection = document.createElement('section');
        orderLogSection.className = 'container order-log hidden';
        orderLogSection.id = 'orderLog';
        orderLogSection.innerHTML = `
            <h4>Registro de Pedido (último)</h4>
            <pre id="orderLogPre"></pre>
            <div class="actions">
                <button id="downloadLog" class="btn-download">Baixar</button>
                <button id="clearLog" class="btn-clear">Limpar</button>
            </div>
        `;
        document.querySelector('footer').before(orderLogSection);
        orderLogPre = document.getElementById('orderLogPre');
        btnDownload = document.getElementById('downloadLog');
        btnClear = document.getElementById('clearLog');
        btnDownload.addEventListener('click', function(){
            const orders = JSON.parse(localStorage.getItem('msi_orders')||'[]');
            const text = JSON.stringify(orders, null, 2);
            const blob = new Blob([text],{type:'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'msi_orders.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        });
        btnClear.addEventListener('click', function(){
            localStorage.removeItem('msi_orders');
            hideLog();
        });
    }

    const svaPlans = ['150 MEGAS','300 MEGAS','400 MEGAS','500 MEGAS','600 MEGAS'];

    // plan prices (BRL)
    const planPrices = {
        '50 MEGAS': 49.50,
        '100 MEGAS': 54.50,
        '150 MEGAS': 57.00,
        '300 MEGAS': 64.50,
        '400 MEGAS': 84.50,
        '500 MEGAS': 119.50,
        '600 MEGAS': 134.50
    };

    const appsChoicesEl = document.getElementById('appsChoices');
    const appsSelectedField = document.getElementById('appsSelectedField');
    const basePriceField = document.getElementById('basePriceField');
    const totalField = document.getElementById('totalField');

    function collectSelectedApps(){
        const checks = appsChoicesEl ? appsChoicesEl.querySelectorAll('input[type=checkbox]') : [];
        const selected = [];
        checks.forEach(c => { if(c.checked){ selected.push({name: c.dataset.name, price: c.dataset.price}); } });
        return selected;
    }

    function updateAppsSelectedField(){
        const sel = collectSelectedApps();
        appsSelectedField.value = sel.map(s => s.name).join(', ');
        updateTotalDisplay();
    }

    function formatBRL(value){
        return Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
    }

    function updateTotalDisplay(){
        const plan = planField.value.trim();
        const base = planPrices[plan] || 0;
        const apps = collectSelectedApps();
        const appsSum = apps.reduce((acc,a)=>acc + (parseFloat(a.price)||0),0);
        const total = base + appsSum;
        if(basePriceField) basePriceField.value = formatBRL(base);
        if(totalField) totalField.value = formatBRL(total);
    }

    function openModal(plan){
        planField.value = plan;
        nameField.value = '';
        addressField.value = '';
        phoneField.value = '';
        // show apps choices only if plan allows SVA
        if(svaPlans.indexOf(plan) !== -1){
            appsChoicesEl.classList.remove('hidden');
            appsChoicesEl.setAttribute('aria-hidden','false');
        } else {
            appsChoicesEl.classList.add('hidden');
            appsChoicesEl.setAttribute('aria-hidden','true');
            // clear any previous selections
            const checks = appsChoicesEl.querySelectorAll('input[type=checkbox]');
            checks.forEach(c => c.checked = false);
        }
        updateAppsSelectedField();
        updateTotalDisplay();
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden','false');
        nameField.focus();
    }

    function closeModal(){
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden','true');
    }

    document.querySelectorAll('.js-order').forEach(function(el){
        el.addEventListener('click', function(e){
            e.preventDefault();
            const plan = el.getAttribute('data-plan') || 'Plano';
            openModal(plan);
        });
    });

    cancelBtn.addEventListener('click', function(){ closeModal(); });

    // wire checkbox changes to update appsSelectedField
    if(appsChoicesEl){
        appsChoicesEl.querySelectorAll('input[type=checkbox]').forEach(function(chk){
            chk.addEventListener('change', updateAppsSelectedField);
        });
    }

    form.addEventListener('submit', function(e){
        e.preventDefault();
        const name = nameField.value.trim();
        const address = addressField.value.trim();
        const phone = phoneField.value.trim();
        const plan = planField.value.trim();
        if(!name || !address || !phone){
            alert('Por favor preencha todos os campos obrigatórios.');
            return;
        }

        const selectedApps = collectSelectedApps();
        const appsText = selectedApps.length ? ('Apps: ' + selectedApps.map(a=>a.name).join(', ') + '.') : '';
        const message = `veio da pagina do Dev Jefson Souza. Quero contratar: ${plan}. ${appsText} Nome: ${name}. Endereco: ${address}. Contato: ${phone}`;
        const url = `https://wa.me/${WA_NUM}?text=` + encodeURIComponent(message);
        // save to localStorage log
        const orders = JSON.parse(localStorage.getItem('msi_orders')||'[]');
        const entry = {plan,name,address,phone,apps:selectedApps,timestamp:new Date().toISOString(),source:'Dev Jefson Souza'};
        orders.push(entry);
        localStorage.setItem('msi_orders', JSON.stringify(orders));
        // show order log section
        ensureLogElements();
        showLog(entry);
        // open WhatsApp
        window.open(url,'_blank','noopener');
        closeModal();
    });

    function showLog(entry){
        ensureLogElements();
        const appsLine = entry.apps && entry.apps.length ? ('\nApps: ' + entry.apps.map(a=>a.name).join(', ')) : '';
        orderLogPre.textContent = `Plano: ${entry.plan}\nNome: ${entry.name}\nEndereço: ${entry.address}\nContato: ${entry.phone}${appsLine}\nData: ${new Date(entry.timestamp).toLocaleString()}`;
        orderLogSection.classList.remove('hidden');
    }

    function hideLog(){
        if(!orderLogSection) return;
        orderLogSection.classList.add('hidden');
        orderLogPre.textContent = '';
    }

    // close modal on overlay click
    modal.addEventListener('click', function(e){
        if(e.target === modal) closeModal();
    });
})();
