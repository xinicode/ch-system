import mvueCore from "@ch/core";

var $resource = null;
var customActions = {
    importLicence: {
        method: 'POST',
        url: '/licence/saveLicence',
        contentType: "application/json"
    },
    getLicenceInfoExcludeTime: {
        method: 'POST',
        url: '/licence/getLicenceInfoExcludeTime',
        contentType: "application/json"
    },
    getLicenceInfoExcludeTimeAndResource: {
        method: 'POST',
        url: '/licence/getLicenceInfoExcludeTimeAndResource',
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