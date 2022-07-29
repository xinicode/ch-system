import { BgComponent, BgCreated, BgProp, BgVue } from "@fly-vue/ts";

@BgComponent({})
export default class Index extends BgVue {
  @BgProp() private msg!: string;


  @BgCreated()
  private _created() {
  }


}