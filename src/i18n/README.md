# Internationalização (i18n)

Sistema de tradução completo para o Question Creator com suporte a **Português (Brasil)**, **Inglês** e **Espanhol**.

## 📁 Estrutura

```
src/i18n/
├── i18nContext.tsx          # Context React + Provider
├── translations/
│   ├── pt-BR.json          # Traduções em Português
│   ├── en.json             # Traduções em Inglês
│   └── es.json             # Traduções em Espanhol
└── README.md               # Este arquivo
```

## 🚀 Como Usar

### 1. Setup (Já feito em `_app.tsx`)

```tsx
import { I18nProvider } from '@/i18n/i18nContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <I18nProvider>
      <Component {...pageProps} />
    </I18nProvider>
  );
}
```

### 2. Usar Traduções em Componentes

```tsx
import { useI18n } from '@/i18n/i18nContext';

export const MyComponent = () => {
  const { t, language, setLanguage } = useI18n();

  return (
    <div>
      {/* Acessar tradução com notação de ponto */}
      <h1>{t('dashboard.welcomeBack')}</h1>
      <p>{t('dashboard.yourProgress')}</p>

      {/* Mudar idioma */}
      <button onClick={() => setLanguage('pt-BR')}>
        Português
      </button>
    </div>
  );
};
```

### 3. Adicionar Novo Texto para Tradução

1. Abra o arquivo `translations/pt-BR.json`
2. Adicione a chave e valor:

```json
{
  "mySection": {
    "myKey": "Meu texto em português"
  }
}
```

3. Repita para `en.json` e `es.json`
4. Use no componente:

```tsx
const { t } = useI18n();
<p>{t('mySection.myKey')}</p>
```

## 🌐 Seletores de Idioma

### Language Selector Component

O componente `LanguageSelector` está integrado na Header e permite:
- Trocar de idioma facilmente
- Persistência em localStorage
- Detecção de idioma do navegador (primeira visita)

### Uso Manual

```tsx
import { useI18n, getAvailableLanguages } from '@/i18n/i18nContext';

export const MyComponent = () => {
  const { language, setLanguage } = useI18n();
  const languages = getAvailableLanguages();

  return languages.map(lang => (
    <button key={lang.code} onClick={() => setLanguage(lang.code)}>
      {lang.name}
    </button>
  ));
};
```

## 💾 Persistência

- Idioma selecionado é **salvo em localStorage** como `language`
- Na primeira visita, o sistema detecta o idioma do navegador
- Se o navegador estiver em português → automaticamente usa PT-BR
- Se estiver em espanhol → automaticamente usa ES
- Caso contrário → defaulta para EN

## 🔄 Idiomas Suportados

| Código | Nome | Bandeira |
|--------|------|----------|
| `pt-BR` | Português (Brasil) | 🇧🇷 |
| `en` | English | 🇺🇸 |
| `es` | Español | 🇪🇸 |

## 📝 Estrutura de Tradução

As traduções seguem uma estrutura hierárquica:

```json
{
  "common": { ... },        // Termos comuns
  "auth": { ... },          // Autenticação
  "navigation": { ... },    // Menu/navegação
  "dashboard": { ... },     // Dashboard
  "questions": { ... },     // Questões
  "exams": { ... },         // Provas/exames
  "results": { ... },       // Resultados
  "validation": { ... },    // Mensagens de validação
  "messages": { ... }       // Mensagens gerais
}
```

## ⚠️ Fallback

Se uma chave de tradução não for encontrada, a função `t()` retorna a própria chave como string. Exemplo:

```tsx
t('nonexistent.key') // Retorna: "nonexistent.key"
```

## 🎯 Próximos Passos

- [ ] Atualizar todos os componentes para usar `useI18n()`
- [ ] Adicionar mais idiomas se necessário
- [ ] Implementar pluralização (ex: "1 questão" vs "2 questões")
- [ ] Adicionar suporte a datas/horas localizadas

## 🤝 Candidatos Naturalizados

O sistema i18n permite que candidatos de **qualquer nacionalidade** acessem a plataforma em seu idioma preferido:

- 🇧🇷 Brasileiros e portugueses → PT-BR
- 🇺🇸 Americanos e canadenses → EN
- 🇲🇽 Mexicanos, argentinos, colombianos → ES
- 🌍 Qualquer um pode escolher manualmente
