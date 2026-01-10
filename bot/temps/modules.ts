export var modules: any[] = [];

export function addModules(module: any) {
    modules.push(module);
}

export function getModule(module_name: string) {
    for (const m of modules) {
        if (m.pathname === module_name) {
            return m;
        }
    }
    return undefined; 
}