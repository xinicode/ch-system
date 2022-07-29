import mvueCore from "@ch/core";

var $resource = null;
var customActions = {
    batchGetInsertSql: {
        method: 'POST',
        url: '/exportSql/batchGetInsertSql',
        contentType: "application/json"
    },
    batchGetUpdateSql: {
        method: 'POST',
        url: '/exportSql/batchGetUpdateSql',
        contentType: "application/json"
    },
    batchGetMenuInsertSql: {
        method: 'POST',
        url: '/exportSql/batchGetMenuInsertSql',
        contentType: "application/json"
    },
    batchGetMenuUpdateSql: {
        method: 'POST',
        url: '/exportSql/batchGetMenuUpdateSql',
        contentType: "application/json"
    }
};

export default function() {
    if ($resource != null) {
        return $resource;
    }
    const baseServiceRoot = mvueCore.config.getConfigVal("service.system.endpoint");
    $resource = mvueCore.resource('/', customActions, {
        root: baseServiceRoot
    });
    return $resource;
};