const cmd = require('commander');
const goMyPack = require("./features").goMyPack;

cmd
    .version(`${require('./package.json').version}`, '-v --version')
    .usage('<command> [options]');

cmd
    .command('start <path>')
    .description('start app')
    .action(async (path) => {
        goMyPack(path, "development");
    });
cmd
    .command('build <path>')
    .description('build app')
    .action(async (path) => {
        goMyPack(path, "production");
    });

cmd.parse(process.argv);