# Expo Go — Como Testar o LabIA (develop)

> O link de teste é gerado automaticamente a cada push na branch `develop` via GitHub Actions + EAS Update.

---

## Pré-requisito (uma vez só)

Instale o **LabIA Dev Build** no dispositivo Android. Este é um build especial que permite receber updates OTA automaticamente.

Para gerar o dev build (CTO executa):
```bash
eas build --profile development --platform android
```

Após o build, instale o `.apk` no dispositivo.

---

## Como testar um novo update

Após cada push em `develop`, o GitHub Actions publica um EAS Update automaticamente.

### Opção 1 — Link direto (Android)

Abra este link no Android para forçar a abertura do app no canal `develop`:

```
exp+labia://expo-development-client/?url=https%3A%2F%2Fu.expo.dev%2F8d010114-50a6-4e90-bcab-4b60fbec9fbc%3Fchannel-name%3Ddevelop
```

### Opção 2 — Automático

Apenas abra o **LabIA Dev Build**. O app verifica e aplica o update mais recente do canal `develop` automaticamente ao iniciar.

### Opção 3 — Painel EAS

Acesse https://expo.dev/@joaofay/cardio-risk-calculator para ver todos os updates publicados e o QR code de cada um.

---

## Ver o link de teste de cada commit

1. Acesse o repositório no GitHub
2. Vá em **Actions** → **Expo Update — develop**
3. Clique no run do commit desejado
4. No resumo do job você verá o link de teste e as instruções

---

## Configuração do CI (para o CTO)

O workflow em `.github/workflows/eas-update.yml` precisa do secret `EXPO_TOKEN` configurado no repositório GitHub:

1. Gere um token em https://expo.dev/accounts/joaofay/settings/access-tokens
2. No repositório GitHub: **Settings → Secrets and variables → Actions → New repository secret**
3. Nome: `EXPO_TOKEN`, valor: o token gerado
