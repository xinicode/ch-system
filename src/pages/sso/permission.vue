<template>
    <div class="http">
        <h2>操作验证：</h2>
        <div v-for="(op,index) in ops" :key="index">
            操作:{{op}}，权限验证结果:{{hasPerm(op)}}
        </div>
        <h2>行级权限验证</h2>
        <div v-for="(record) in records" :key="record.id">
            记录:{{record.id}}，权限验证结果:{{hasRowPerm(record,'update')}}
        </div>
    </div>
</template>

<script>
import { PermissionService } from '../../../module/security/permission';
export default {
    data() {
        PermissionService.addAuthorization({
            get: '',
            entities: {
                App: { create: '', find: '', query: '', list: '' },
                Candidate: { create: '', update: '', edit: '', delete: '', find: '', query: '', list: '' },
                User: {
                    create: '',
                    update: '',
                    edit: '',
                    delete: '',
                    find: '',
                    query: '',
                    list: '',
                    __row_ops__: {
                        create: ['Candidate:create']
                    }
                }
            }
        });
        return {
            ops: ['get', 'get2', 'app:create', 'app:find', 'app:aa'],
            records:[{ id:"record1", "__ops__":["create", "update"] },
                { id:"record2", "__ops__":["create", "admin"] }
            ]
        };
    },
    mounted() {
        
    },
    methods: {
        hasPerm(op){
            return PermissionService.hasPerm(op);
        },
        hasRowPerm(record, op){
            return PermissionService.hasRowPerm(record, op);
        }
    }
};
</script>
<style lang="less">
.http-test {
    button {
        display: inline-block;
        margin: 10px;
    }
}
</style>
