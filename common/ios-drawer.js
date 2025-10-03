/* Trivial implementation of iOS-style drawer with command buttons */
const drawer = document.getElementById("iosDrawer");
const drawerCommands = document.getElementById("drawerCommands");
const handle = document.getElementById("drawerHandle");
let collapsed = true;
drawer.addEventListener("mousedown", event => {
	if (event.target === handle || (event.target === drawer && event.offsetY < drawer.clientHeight - drawerCommands.clientHeight)) {
		event.preventDefault();
		collapsed = !collapsed;
		drawer.classList.toggle("collapsed", collapsed);
	}
});
