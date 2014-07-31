'use strict';

describe('Integration: addBlueprint', function () {
    var fs = require('fs');
    var cloudify4node = require('../../../../backend/Cloudify4node');
    var fileData = require('../../resources/blueprint/fileData.json');

    it('has a cloudify4node', function () {
        expect(cloudify4node).not.toBeUndefined();
    });

    it('should have addBlueprint method', function () {
        expect(typeof(cloudify4node.addBlueprint)).toBe('function');
    });

    it('should add blueprint successfully', function() {
        var result;
        var successResult;
        var blueprintName = 'blueprint' + new Date().getTime();

        fs.readFile('./test/backend/resources/blueprint/successResult.json', 'utf-8', function (err, data) {
            data = data.replace(/blueprint1/g, blueprintName);
            successResult = JSON.parse(data);
        });

        waitsFor(function () {
            return fileData !== undefined;
        }, "waiting for upload result", 10000);

        runs(function () {
            cloudify4node.addBlueprint(fileData, blueprintName, function (data) {
                result = JSON.parse(data);
            });
        });

        waitsFor(function () {
            return result !== undefined && successResult !== undefined;
        }, "waiting for upload result", 5000);

        runs(function () {
            successResult.updated_at = result.updated_at;
            successResult.created_at = result.created_at;

            expect(JSON.stringify(result)).toBe(JSON.stringify(successResult));
        });
    });
});
