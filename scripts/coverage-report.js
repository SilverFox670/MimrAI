const fs = require('fs');
const path = require('path');

function readCoverage() {
    const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    
    const total = coverage.total;
    
    console.log('\nCoverage Summary:');
    console.log('================');
    console.log(`Statements : ${total.statements.pct}%`);
    console.log(`Branches   : ${total.branches.pct}%`);
    console.log(`Functions  : ${total.functions.pct}%`);
    console.log(`Lines      : ${total.lines.pct}%`);
    console.log('================\n');
    
    const files = Object.entries(coverage)
        .filter(([key]) => key !== 'total')
        .map(([file, metrics]) => ({
            file,
            statements: metrics.statements.pct,
            branches: metrics.branches.pct,
            functions: metrics.functions.pct,
            lines: metrics.lines.pct
        }))
        .filter(file => 
            file.statements < 100 || 
            file.branches < 100 || 
            file.functions < 100 || 
            file.lines < 100
        );
    
    if (files.length > 0) {
        console.log('Files needing coverage:');
        console.log('=====================');
        files.forEach(file => {
            console.log(`\n${file.file}`);
            if (file.statements < 100) console.log(`  Statements: ${file.statements}%`);
            if (file.branches < 100) console.log(`  Branches  : ${file.branches}%`);
            if (file.functions < 100) console.log(`  Functions : ${file.functions}%`);
            if (file.lines < 100) console.log(`  Lines     : ${file.lines}%`);
        });
    } else {
        console.log('🎉 All files have 100% coverage!');
    }
}

readCoverage();
