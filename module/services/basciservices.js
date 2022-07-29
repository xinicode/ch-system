import mvueCore from "@ch/core";

var $resource = null;
var customActions = {
    queryPageList: { method: 'POST', url: 'basicApi/queryPageList' },
    querySysDisct: { method: 'GET', url: 'basicApi/querySysDisct' },
    queryListOfTree: { method: 'GET', url: 'basicApi/queryListOfTree' },
    getSystemConfigParams: { method: 'GET', url: "basicApi/getSystemConfigParams" }
};

export default function() {
    if ($resource != null) {
        return $resource;
    }
    // "http://localhost:8030";//
    const baseServiceRoot = mvueCore.config.getConfigVal("service.approle.endpoint");
    $resource = mvueCore.resource('/', customActions, { root: baseServiceRoot });
    return $resource;
};