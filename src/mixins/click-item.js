import { findComponentUpward } from 'view-design/src/utils/assist';
import { mapState } from 'vuex';
import _ from 'lodash';

let _lastPath = '';

export default {
    computed: {
        ...mapState('admin/layout', [
            'menuSiderReload',
            'menuHeaderReload'
        ]),
    },
    methods: {
        handleClick(path, type = 'sider') {
            const isEqualPath = function (path1, path2) {
                if (path1 === path2) return true;
                if (!path1 || !path2) return false;
                const url1 = CmpHelper.getUrlPart(path1);
                const query1 = CmpHelper.queryParse(path1.split('?')[1]);
                const url2 = CmpHelper.getUrlPart(path2);
                const query2 = CmpHelper.queryParse(path.split('?')[1]);
                return url1 === url2 && _.isEqual(query1, query2);
            };
            let isEqual = isEqualPath(_lastPath, path);
            _lastPath = path;

            if (isEqual) {
                if (type === 'sider' && this.menuSiderReload) this.handleReload();
                else if (type === 'header' && this.menuHeaderReload) this.handleReload();
            }

        },
        handleReload() {
            const $layout = findComponentUpward(this, 'CmpLayout');
            if ($layout) $layout.handleReload();
        }
    }
}
