import { BgComponent, BgCreated, BgMounted, BgProp, BgUpdated, BgVue } from "@fly-vue/ts";
import { CmpVueComponent, CmpVueWatch } from "@ch/core";
import {CmpSystemMixin} from "@ch/system";

@CmpVueComponent({
  mixins: [CmpSystemMixin]
})

@BgComponent({})
export default class Index extends BgVue {
  @BgProp() private msg!: string;


  column = [{"title":"1111"},{"title":"33333"}];
  aaa = ['8cf35cae-7aa5-455b-8cc9-9920c9796416'];
  orgId1 = null;
  model = {
    selectedUsers: []
  };
  selecteDisabled = false;

  custId = null;

  custId2 = "11111111-11111111-11111111-11111111";
  
  @BgCreated()
  private _created() {
    this.orgId1 = this.aaa;

   
  }
  handSelect(ids,detail) {
    console.log(this.orgId1,"0000002222222222222000000000")
    //this.orgId = ids;
    console.log(ids,"-----------------")
  }

  @BgMounted()
  private _mountd() {

    this.$nextTick(() => {
      let ele:any = this.$refs.selectCust2;
    console.log(ele.data01,"pppppppppp")
    });
    
  }



  handClear() {
    this.orgId1 = [];
  }
  
  @CmpVueWatch("orgId") 
  watchOrgId(value) {
    console.log(value,"kkjkhh nnnnnnn");
  }


  @CmpVueWatch('orgId')
  private _watchValue(values) {
      console.log(values,"fffffffffffff")
  }


  clearOrg() {
    // let ele:any = this.$refs.selectOrg;
    // ele.clearOrg();
    this.orgId1 = [];
  }
  

  handChange(datas) {
    console.log(this.custId2,"0000")
  }

  handShow(show) {
    console.log(show);
  }

}