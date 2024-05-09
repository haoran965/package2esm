
import {mkdirSync, readdirSync, lstatSync, readlinkSync, symlinkSync, copyFileSync, readFileSync, existsSync, writeFileSync, rmdirSync} from 'fs'
import * as path from 'path'
import * as esbuild from 'esbuild'


const modulesPath = path.resolve(process.cwd(), './node_modules')

export function copyNodeModules (fromPath?: string, targetFolder: string = './esm') {
    if (existsSync(targetFolder)) {
        rmdirSync(targetFolder, { recursive: true })
    }
    copyDir(fromPath ? path.join(modulesPath, fromPath) : modulesPath, targetFolder)
    return targetFolder
}

export function copyDir (src: string, target: string) {
    mkdirSync(target, { recursive: true })

    for (const item of readdirSync(src)) {
        const srcItem = path.join(src, item)
        const destItem = path.join(target, item)

        const stat = lstatSync(srcItem)
        if (stat.isDirectory()) {
            copyDir(srcItem, destItem)
        } else if (stat.isSymbolicLink()) {
            const symlinkPath = readlinkSync(srcItem)
            symlinkSync(symlinkPath, destItem)
        } else {
            copyFileSync(srcItem, destItem)
        }
    }
}

function getMainFile(pkg: any): [string, string[]] | undefined{
    if (pkg.main) {
        return [pkg.main, ['main']]
    }
    if (pkg.exports) {
        if (typeof pkg.exports === 'object') {
            return [pkg.exports.default, ['exports', 'default']]
        }
        return [pkg.exports, ['exports']]
    }

    if (pkg.imports) {
        const mainFile = pkg.imports.find(item => item.includes('.js'));
        if (mainFile) {
            return [mainFile, ['imports', pkg.imports.indexOf(mainFile)]];
        }
    }
    if (pkg.files) {
        const mainFile = pkg.files.find(item => item.includes('.js'));
        if (mainFile) {
            return [mainFile, ['files', pkg.files.indexOf(mainFile)]];
        }
    }
}

export function convertModuleToMjs(modulePath: string, moduleName: string) {
    try {
        const pkgPath = `${modulePath}/${moduleName}/package.json`
        console.log("pkgPath", pkgPath)
        if (!existsSync(pkgPath)) {
            console.info(`[convert-to-cjs] Cannot find package.json, skip ${moduleName}`)
            return
        }

        const pkg = JSON.parse(readFileSync(pkgPath).toString())
        const result = getMainFile(pkg)
        if (!result) {
            console.warn(`[convert-to-mjs] Cannot find main endpoint, skip ${moduleName}`)
            return;
        }
        const [mainFile, mainFilePath] = result;
        if (mainFile && !mainFile.endsWith('.mjs')) {
            const entrypoint = `${modulePath}/${moduleName}/${mainFile}`
            const outfile = `${modulePath}/${moduleName}/src/${mainFile.split('.').slice(0, -1).join('.')}.mjs`
            esbuild.buildSync({
                entryPoints: [entrypoint],
                format: 'esm',
                outfile: outfile,
                logLevel: "silent"
            })
            if (mainFilePath.length === 1) {
                pkg[mainFilePath[0]] = mainFile.split('.').slice(0, -1).join('.') + '.mjs'
            } else if (mainFilePath.length === 2) {
                pkg[mainFilePath[0]][mainFilePath[1]] = mainFile.split('.').slice(0, -1).join('.') + '.mjs'
            } else {
                console.error(`[convert-to-mjs] Cannot convert ${moduleName}`)
            }

            writeFileSync(pkgPath, JSON.stringify(pkg, undefined, 2), 'utf8')
        }
    } catch (e) {
        console.error(`[convert-to-mjs] Error converting ${moduleName}`, e)
        throw e;
    }

}

export function convertAllModulesToMjs(modulePath: string) {
    readdirSync(modulePath).forEach(name => {
        convertModuleToMjs(modulePath, name)
    })
}

