const axios = require('axios')
const fs = require('fs')
const moment = require('moment')
const pressAnyKey = require('press-any-key')
const prompt = require('prompt')

async function fileFromDate(input, date1, date2) {
    const res = await axios
        .post('https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns',
            `calismatipi=1&fontip=YAT&sfontur=&kurucukod=&fongrup=&bastarih=${date1.format('DD.MM.YYYY')}&bittarih=${date2.format('DD.MM.YYYY')}&fonturkod=&fonunvantip=&strperiod=1%2C1%2C1%2C1%2C1%2C1%2C1&islemdurum=`);
    res.data.data
        .filter(v => ['YAY', 'YAN', 'YAK', 'YDI', 'YEF', 'YKT', 'YHS', 'YAS', 'YAC'].includes(v.FONKODU))
        .map(v => {
            return {
                tarih: date2,
                kod: v.FONKODU,
                oran: v.GETIRIORANI
            }
        })
        .sort((v, w) => v.kod.localeCompare(w.kod))
        .forEach(v => {
            input.push(v);
        })
    console.log(`${date2.format('DD.MM.YYYY')} datasi indirildi`)
}

async function getAllFiles(todayStr, dateStartStr, dateEndStr) {
    const today = moment(todayStr, 'DD.MM.YYYY')
    const dateStart = moment(dateStartStr, 'DD.MM.YYYY')
    const dateEnd = moment(dateEndStr, 'DD.MM.YYYY')

    let dateAcc = dateStart.clone()
    const dates = []
    while (dateAcc.isSameOrBefore(dateEnd)) {
        dates.push(dateAcc.clone())
        dateAcc = dateAcc.add(1, 'days');
    }
    let data = []
    for (const v of dates) {
        await fileFromDate(data, today, v)
    }
    const fileName = `${today.format('DD.MM.YYYY')} bazli, ${dateStart.format('DD.MM.YYYY')}, ${dateEnd.format('DD.MM.YYYY')} arasi oran degisimi.csv`
    fs.writeFile(fileName, `Tarih, Fon Kodu, Oran\n${data.map(v => `${v.tarih.format('DD.MM.YYYY')},${v.kod},${v.oran}`).join('\n')}`, () => { })
    return `${fileName} yaratildi`
}

prompt.start();
prompt.get([
    {
        name: 'today',
        description: 'Fon Aldigin Tarih',
        validator: /^\d{2}.\d{2}.\d{4}$/,
        warning: 'DD.MM.YYYY formatinda girilmeli, Ornek: 25.03.2020'
    },
    {
        name: 'dateStart',
        description: 'Data Baslangic Tarihi',
        validator: /^\d{2}.\d{2}.\d{4}$/,
        warning: 'DD.MM.YYYY formatinda girilmeli, Ornek: 25.03.2020'
    },
    {
        name: 'dateEnd',
        description: 'Data Bitis Tarihi',
        validator: /^\d{2}.\d{2}.\d{4}$/,
        warning: 'DD.MM.YYYY formatinda girilmeli, Ornek: 25.03.2020'
    },
], async function (err, result) {
    if (err) {
        console.log(err);
        return 1;
    }
    const response = await getAllFiles(result.today, result.dateStart, result.dateEnd);
    pressAnyKey(`${response}\nKapatmak icin herhangi bir tusa bas...`);
});

function onErr(err) {
    console.log(err);
    return 1;
}
