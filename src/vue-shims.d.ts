interface Window {
    config: string;
}

declare module "*.vue" {
    import Vue from "vue";
    export default Vue;
}


