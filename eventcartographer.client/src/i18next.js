import i18next from "i18next";
import I18NextHttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18next.use(initReactI18next).use(I18NextHttpBackend).init({
    debug: false,
    fallbackLng: localStorage.getItem('language') ||
        navigator.language ||
        document.documentElement.lang ||
        'en',
    returnObjects: true
});

export default i18next;
