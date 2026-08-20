module.exports = {
    meshcentral_timecontrol: function (pluginHandler) {
        var obj = {};
        obj.parent = pluginHandler;
        obj.name = "Controle de Tempo";

        obj.registerHook = function() {
            return ["onWebUIStart"];
        };

        obj.onWebUIStart = function () {
            if (obj.parent && typeof obj.parent.registerOnDeviceSelectedTab === 'function') {
                obj.parent.registerOnDeviceSelectedTab({
                    id: "tabTimeControl",
                    name: "Controle de Tempo",
                    callback: obj.desenharInterfaceTempo
                });
            }
        };

        obj.desenharInterfaceTempo = function (nodeid, container) {
            container.innerHTML = `
                <div style="padding:20px; font-family: sans-serif; color: #333;">
                    <h2 style="margin-bottom:15px; display:flex; align-items:center; gap:10px;">⏱️ Relatório de Horas por Usuário</h2>
                    <table style="width:100%; border-collapse: collapse; text-align: left; background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <thead>
                            <tr style="background-color: #0056b3; color: white;">
                                <th style="padding: 12px; border: 1px solid #ddd;">Data</th>
                                <th style="padding: 12px; border: 1px solid #ddd;">Usuário Logado</th>
                                <th style="padding: 12px; border: 1px solid #ddd;">Entrada (Logon)</th>
                                <th style="padding: 12px; border: 1px solid #ddd;">Saída (Logoff)</th>
                                <th style="padding: 12px; border: 1px solid #ddd;">Total Horas</th>
                            </tr>
                        </thead>
                        <tbody id="tabela-tempo-corpo">
                            <tr><td colspan="5" style="padding:15px; text-align:center;">Carregando logs de auditoria...</td></tr>
                        </tbody>
                    </table>
                </div>
            `;

            obj.parent.getDeviceEvents(nodeid, function (events) {
                if (!events || events.length === 0) {
                    document.getElementById("tabela-tempo-corpo").innerHTML = '<tr><td colspan="5" style="padding:15px; text-align:center;">Nenhum registro encontrado.</td></tr>';
                    return;
                }

                let html = "";
                let loginTemp = null;
                let usuarioNome = "Usuário";

                for (let i = events.length - 1; i >= 0; i--) {
                    let ev = events[i];
                    let msg = ev.msg ? ev.msg.toLowerCase() : "";

                    if (msg.includes("user login") || msg.includes("logged in") || msg.includes("session authenticated")) {
                        loginTemp = new Date(ev.time);
                        let match = ev.msg.match(/user\s+([^\s]+)/i);
                        usuarioNome = match ? match[1] : (ev.user ? ev.user : "Funcionário");
                    } 
                    else if ((msg.includes("user logout") || msg.includes("logged out") || msg.includes("agent disconnect")) && loginTemp !== null) {
                        let logoutTime = new Date(ev.time);
                        let diferencaMilissegundos = logoutTime - loginTemp;
                        let totalMinutos = Math.floor(diferencaMilissegundos / 60000);
                        let horas = Math.floor(totalMinutos / 60);
                        let minutos = totalMinutos % 60;

                        if (totalMinutos >= 1) {
                            let dataFormatada = loginTemp.toLocaleDateString('pt-BR');
                            let entradaFormatada = loginTemp.toLocaleTimeString('pt-BR');
                            let saidaFormatada = logoutTime.toLocaleTimeString('pt-BR');

                            html += `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 12px; border: 1px solid #ddd;">${dataFormatada}</td>
                                    <td style="padding: 12px; border: 1px solid #ddd; font-weight:bold; color:#1a73e8;">${usuarioNome}</td>
                                    <td style="padding: 12px; border: 1px solid #ddd;">${entradaFormatada}</td>
                                    <td style="padding: 12px; border: 1px solid #ddd;">${saidaFormatada}</td>
                                    <td style="padding: 12px; border: 1px solid #ddd; font-weight:bold; color:#2e7d32;">${horas}h ${minutos}m</td>
                                </tr>
                            `;
                        }
                        loginTemp = null; 
                    }
                }
                document.getElementById("tabela-tempo-corpo").innerHTML = html || '<tr><td colspan="5" style="padding:15px; text-align:center;">Nenhum turno completo computado hoje.</td></tr>';
            });
        };

        return obj;
    }
};
