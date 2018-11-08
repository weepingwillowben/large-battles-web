var default_stats = {
    "unit_types": {
        "soldier": {
            "attack_range": 1,
            "move_range": 3,
        },
        "catapult": {
            "attack_range": 3,
            "move_range": 1,
        }
    }
}
var icons = {
    "background_icon": "Background.bmp",
    "unit_icons": {
        "soldier": "Soldier.png",
        "catapult": "Catapult.png",
    },
}

function get_all_sources(){
    var unit_icons = Object.values(icons.unit_icons)
    var base_icons = [icons.background_icon]
    return unit_icons.concat(base_icons)
}
module.exports = {
    default_stats: default_stats,
    icons: icons,
    get_all_sources: get_all_sources,
}
