var basecomp = require("./base_component.js")
var signals = require("./global_signals.js")
var player_utils = require("../player_utils.js")
var make_change_script_popup = require("./change_script.js").make_change_script_popup

var BaseComponent = basecomp.BaseComponent
var createEl = basecomp.createEL
var createDiv = basecomp.createDiv
var createSpan = basecomp.createSpan

var Signal = signals.Signal

var edit_signal = new Signal()
var stop_edit_signal = new Signal()
signals.selectedData.listen(()=>signals.clear_clicks.fire())
edit_signal.listen(()=>signals.clear_clicks.fire())
signals.clickCycleFinished.listen(()=>signals.clear_clicks.fire())

class LibPannel extends BaseComponent {
    constructor(parent, basediv){
        super(parent, basediv)
        this.interface_div = createDiv({
            className: "lib_pannel_container",
        })
        basediv.appendChild(this.interface_div)
        this.state = {
            js_lib: "",
        }
        this.stop_edit()
        this.handle_signals()
    }
    start_edit(){
        $(this.interface_div).empty()
        this.edit_lib_button = createDiv({
            innerText: "Edit Library",
            className: "lib_edit_button",
            parent: this.interface_div,
            onclick: () => {
                make_change_script_popup(this.state.js_lib,Function,(js_code) => {
                    this.state.js_lib = js_code
                })
            }
        })
        this.edit_button = createDiv({
            innerText: "Stop Edit",
            className: "lib_edit_button",
            parent: this.interface_div,
            onclick: () => {stop_edit_signal.fire()}
        })
    }
    stop_edit(){
        $(this.interface_div).empty()
        this.edit_button = createDiv({
            innerText: "Edit",
            className: "lib_edit_button",
            parent: this.interface_div,
            onclick: () => {edit_signal.fire()}
        })
    }
    handle_signals(){
        edit_signal.listen(() => {this.start_edit()})
        stop_edit_signal.listen(() => {this.stop_edit()})
    }
}
class ScriptInterface extends BaseComponent {
    constructor(parent, basediv){
        super(parent,basediv)
        this.mybuttonpannel = new ScriptButtonPannel(this,basediv)
        this.libbuttonpannel = new LibPannel(this,basediv)
        this.edit_overlay = new EditOverlay(this,basediv)
    }
    children(){
        return [this.mybuttonpannel,this.libbuttonpannel,this.edit_overlay]
    }
}
class EditOverlay extends BaseComponent {
    constructor(parent, basediv){
        super(parent,basediv)
        this.overlay_div = createDiv({
            className: "game_overlay",
        })
        basediv.appendChild(this.overlay_div)
        $(this.overlay_div).hide()
        this.overlay_div.onclick = this.overlay_gone.bind(this)
        this.handle_signals()
    }
    handle_signals(){
        edit_signal.listen(() => {$(this.overlay_div).show()})
        stop_edit_signal.listen(() => {$(this.overlay_div).hide()})
    }
    overlay_gone(){
        stop_edit_signal.fire()
    }
}
class ScriptButtonPannel extends BaseComponent {
    constructor(parent, basediv){
        super(parent, basediv)
        this.interface_div = createDiv({
            className: "script_container",
        })
        var initial_button_datas = [
            {
                click_num:2,
                js_file:"make_soldier(clicks)",
            },
            {
                click_num:2,
                js_file:"make_catapult(clicks)",
            }
        ]
        basediv.appendChild(this.interface_div)
        this.makeButtonsFromData(initial_button_datas)
        this.buttons[0].selectScript()
    }
    makeButtonsFromData(init_data){
        this.buttons = []
        init_data.forEach((data) => {
            this.buttons.push(new ScriptButton(this, this.interface_div, data))
        })
    }
    children(){
        return this.buttons
    }
}
class ScriptButton extends BaseComponent {
    constructor(parent, basediv, init_data){
        super(parent, basediv)

        this.state = {
            data: init_data,
            selected: false,
            editing: false,
        }
        this.mydiv = this.render()
        basediv.appendChild(this.mydiv)
        this.handle_signals()
    }
    handle_signals(){
        edit_signal.listen(() => {
            this.state.editing = true;
            this.changedState();
        })
        stop_edit_signal.listen(() => {
            this.state.editing = false;
            this.changedState();
        })
        signals.selectedData.listen(() => {
            this.deselectScript();
        })
    }
    deselectScript(){
        if(this.state.selected){
            this.state.selected = false;
            this.changedState()
        }
    }
    selectScript(){
        if(!this.state.selected){
            signals.selectedData.setState(this.state.data)
            this.state.selected = true;
            this.changedState()
        }
        //this.changeState(Object.assign({selected:true},this.state))
    }
    changedState(){
        var newmydiv = this.render()
        this.basediv.replaceChild(newmydiv,this.mydiv)
        this.mydiv = newmydiv
    }
    render(){
        var myself = this
        var myChildren = !this.state.editing ? [] :  [
            createSpan({
                className: "script_box_button script_box_edit_button",
                innerText: "Edit",
                onclick: (function(){
                    make_change_script_popup(myself.state.data.js_file,Function,function(js_code){
                        myself.state.data.js_file = js_code
                        if(myself.state.selected){
                            console.log(myself.state)
                            signals.selectedData.setState(myself.state.data)
                            myself.state.selected = true;
                            myself.changedState()
                        }
                    })
                })
            }),
            document.createTextNode(" "),
            createSpan({
                className: "script_box_button script_box_delete_button",
                innerText: "Delete",
            })
        ]
        var el = createDiv({
            className: "game_script_box",
            children: myChildren,
        })
        if(!this.state.editing){
            el.onclick = this.selectScript.bind(this)
        }
        if(this.state.selected){
            el.classList.add("game_script_box_selected")
        }
        return el;
    }
}
class PlayerInfoPannel extends BaseComponent {
    constructor(parent, basediv, player_ids){
        super(parent, basediv)
        var player_rows = player_ids.map(this.makePlayerRow.bind(this))
        this.table_div = document.getElementById("player_info_tbody")
        this.table_div.innerHTML = ''
        player_rows.forEach((row)=>this.table_div.appendChild(row))
        this.createEndTurnButton()
    }
    createEndTurnButton(){
        $("#end_turn_button").click(function(){
            signals.ended_turn.fire()
        })
        function status_changed(){
            if(signals.activePlayer.getState() === signals.myPlayer.getState()){
                $("#end_turn_button").show()
            }
            else{
                $("#end_turn_button").hide()
            }
        }
        signals.activePlayer.listen(status_changed)
        signals.myPlayer.listen(status_changed)
    }
    createStatusCircle(player_id){
        var circ = createSpan({
            className: "player_status_dot",
        })
        signals.activePlayer.listen(() => this.statusChanged(circ,player_id))
        signals.myPlayer.listen(() => this.statusChanged(circ,player_id))
        return circ
    }
    statusChanged(circ,player_id){
        var act_player = signals.activePlayer.getState()
        var myplayer = signals.myPlayer.getState()
        var newcolor = this.colorForState(player_id,myplayer,act_player)
        circ.style["background-color"] = newcolor
    }
    makePlayerRow(player_id){
        var player_box = createEl('tr',{
            children: [
                createEl('td',{
                    children: [this.createStatusCircle(player_id)]
                }),
                createEl('td',{
                    children: [createSpan({
                        innerText: player_id
                    })]
                }),
                createEl('td',{
                    children: [this.makeMoney(player_id)]
                })
            ]
        })
        return player_box
    }
    colorForState(this_id,my_id,active_id){
        if(this_id === my_id && this_id === active_id){
            return "green"
        }
        else if(this_id === my_id){
            return "blue"
        }
        else if(this_id === active_id){
            return "red"
        }
        else{
            return "white"
        }
    }
    makeMoney(player_id){
        var money = createSpan({})
        signals.moneyChange.listen((money_player) => {
            if(money_player.player === player_id){
                money.innerText = money_player.money
            }
        })
        return money
    }
}
module.exports = {
    ScriptInterface: ScriptInterface,
    PlayerInfoPannel: PlayerInfoPannel,
}