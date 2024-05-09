#!/usr/bin/env node

import sade from 'sade'
import { readFileSync } from 'fs'
import {convertAllModulesToMjs, convertModuleToMjs, copyNodeModules} from './convert'
import path from "path";


const pkgBuffer = readFileSync('./package.json');
const pkg = JSON.parse(pkgBuffer.toString());

// updateNotifier({ pkg }).notify();

sade('convert-package-to-esm', true)
    .describe("Convert node_modules to cjs format.")
    .version(pkg.version)
    .option('-c, --copy', 'is copy node_modules to other directory, default is false', false)
    .option('-a, --all', 'is convert all package to esm, default is false', false)
    .option('-o, --output', 'output directory, default is ./esm, only work when copy is true or all is true', './esm')
    .action(convertPackageToEms)
    .parse(process.argv)

async function convertPackageToEms(args) {
    console.log('args', args)
    if (args.all) {
        if (args.copy) {
            copyNodeModules(undefined, args.output)
            console.log('convert all packages from node_modules to ./esm')
            convertAllModulesToMjs(args.output)
        } else {
            console.log('convert all packages in node_modules')
            convertAllModulesToMjs('node_modules')
        }
    } else {
        const convertPackages = args['_'];
        convertPackages.forEach((moduleName: string) => {
            if (args.copy) {
                console.log('convert packages from node_modules to ./esm')
                copyNodeModules(moduleName, args.output)
                convertModuleToMjs(args.output, moduleName)
            } else {
                console.log('convert packages in node_modules')
                convertModuleToMjs(path.resolve(process.cwd(), './node_modules'), moduleName)
            }
        })

    }
}