/** Where the Extension Host (and therefore every probe) actually runs, e.g. `linux · wsl`. */
export function hostLabel(remoteName?:string,platform:string=process.platform):string {
 return platform+(remoteName?' · '+remoteName:'');
}
