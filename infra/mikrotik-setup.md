# MikroTik CCR2004 — Setup VaiConecta

## 1. Criar usuário de API
```
/user add name=api-user password=SENHA_FORTE group=full
```

## 2. Ativar REST API (RouterOS v7)
A REST API está habilitada por padrão na porta 80/443.
Para forçar HTTPS: System > Services > www-ssl > habilitado.

## 3. Hotspot Setup
```
/ip hotspot setup
  interface: bridge-local (ou a interface correta)
  server name: hotspot1
  dns name: hotspot.vaiconecta.com.br
  html directory: hotspot
```

## 4. Walled Garden (acesso antes do pagamento)
Permitir acesso ao domínio vaiconecta.com.br e APIs do Mercado Pago:
```
/ip hotspot walled-garden
  add dst-host=vaiconecta.com.br
  add dst-host=*.vaiconecta.com.br
  add dst-host=api.mercadopago.com
  add dst-host=*.mercadopago.com
  add dst-host=*.mercadolibre.com
```

## 5. Redirecionamento do Captive Portal
O MikroTik redireciona para a URL do portal automaticamente.
Configure o login-page do hotspot para:
```
https://www.vaiconecta.com.br/portal?mac=$MAC&ip=$IP
```

## 6. VLANs para os 18 APs Ubiquiti
```
/interface vlan
  add interface=ether1 vlan-id=10 name=vlan-wifi-clientes
  add interface=ether1 vlan-id=20 name=vlan-mgmt-aps
```

## 7. WireGuard (túnel para Railway)
```
/interface wireguard
  add name=wg-railway listen-port=51820
/ip address
  add address=10.100.0.2/24 interface=wg-railway
/interface wireguard peers
  add interface=wg-railway public-key="CHAVE_PUBLICA_RAILWAY" allowed-address=10.100.0.1/32
```

## Endpoints da REST API
- Base: https://10.100.0.2/rest/
- Listar usuários hotspot: GET /ip/hotspot/user
- Criar usuário: PUT /ip/hotspot/user
- Deletar usuário: DELETE /ip/hotspot/user/{id}
- Sessões ativas: GET /ip/hotspot/active
- Identidade: GET /system/identity
