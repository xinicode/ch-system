<template>
  <div>
    欢迎使用 iView Admin Pro - {{$t('cmp.system.user.title')}}
    <cmp-help-tip content="这是提示信息"  size="20"></cmp-help-tip>
    <p>cmp-teable-select</p>
    <cmp-table-select 
    :columnsP="column" 
    :showBtn="true" 
    :treeConfigP="null" 
    showType="table"></cmp-table-select>
    <p>选组织</p>
    <cmp-org-select 
      :multiple="false" 
      @on-select-change="handSelect" 
      v-model="orgId1"
      ref="selectOrg"
      >
    </cmp-org-select>
    <p>选租户</p>
     <cmp-cust-select 
      :multiple="false" 
      @on-select-change="handSelect" 
      v-model="custId"
      ref="selectCust"
      >
    </cmp-cust-select>

    <p>选租户2</p>
     <cmp-customer-select 
      :multiple="false" 
      @handChange="handChange" 
      @handShow="handShow"
      v-model="custId2"
      ref="selectCust2"
      placeholder="请选择租户111"
      :clearable="true"
      >
    </cmp-customer-select>


    <p>选用户</p>
    <cmp-select-user v-model="model.selectedUsers" :disabled="selecteDisabled" :fullscreen = "false" ></cmp-select-user>
    <cmp-image src="http://10.16.55.66/modules/cmp_iaas/assets/images/icon-baseecs.png" errSrc="http://10.16.55.66/modules/cmp_iaas/assets/images/bg.png" v-if="false"></cmp-image>
    <Button type="primary" @click="clearOrg">清空</Button>
  </div>
</template>
<script lang="ts" src="./index.ts"></script>
<style lang="less">
.demo-split-pane{
  height: 100%;
  overflow: auto;
}
</style>
