/**
 * Converting plots (time series) to Excel sheets
 */

const Excel = require('exceljs/modern.nodejs');

const plotToExcelHandler = (req, res) => {
    if (req.body && req.body.title && req.body.data && Array.isArray(req.body.data)) {
        let worksheetNames = {};
        var workbook = new Excel.Workbook();
        req.body.data.map((item) => {
            if (item.name in worksheetNames) {
                worksheetNames[item.name] = worksheetNames[item.name] + 1;
            } else {
                worksheetNames[item.name] = 1;
            }

            let worksheetName = item.name + ` (#${worksheetNames[item.name]})`;
            var sheet = workbook.addWorksheet(worksheetName);
            item.x.map((xItem, index) => {
                let yItem = item.y[index];
                if (index === 0) {
                    var row = sheet.getRow(1);
                    row.getCell(1).value = ('x');
                    row.getCell(2).value = ('y');
                }

                var row = sheet.getRow(index + 2);
                row.getCell(1).value = (xItem + '');
                row.getCell(2).value = (yItem + '');
            });
        });

        workbook.xlsx.write(res).then(function() {
            res.end()
        });
    } else {
        res.status(400);
        res.send({
            status: `error`,
            message: `Title and at least one data set has to be provided`
        });
    }
};

module.exports = plotToExcelHandler;