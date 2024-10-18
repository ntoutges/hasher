export class Grid {
    constructor(parent, templates) {
        this.el = document.createElement("div");
        this.el.classList.add("data");
        parent.append(this.el);
        this.parent = parent;
        this.templates = templates.content;
    
        this.el.addEventListener("click", this.handleClick.bind(this));
    }

    add(data, prepend=false) {
        const row = this.templates.querySelector(".data-row").cloneNode(true);
        prepend ? this.el.prepend(row) : this.el.append(row);

        row.querySelector(".hash-type").textContent = data.type ?? "-";
        row.querySelector(".hash-plaintext").textContent = "".padStart(((data.plaintext ?? "-").length), "*");
        row.querySelector(".hash-plaintext").dataset.value = data.plaintext ?? "-";
        row.querySelector(".hash-digest").textContent = data.digest ?? "-";
        row.querySelector(".hash-created").textContent = data.created ? Grid.genDateString(data.created) : "-";
    
        const separator = this.templates.querySelector(".data-separator").cloneNode(true);
        prepend ? row.after(separator) : row.after(separator);
    }

    handleClick(e) {
        const target = (e.target.tagName == "TEXT") ? e.target.parentNode : e.target;

        if (target.classList.contains("hash-plaintext")) {
            if (target.textContent == target.dataset.value) { navigator.clipboard.writeText(target.textContent); } // Second click; copy to cliplboard
            target.textContent = target.dataset.value;
            return;
        }

        if (target.classList.contains("hash-digest")) {
            navigator.clipboard.writeText(target.textContent);
            return;
        }

    }

    static genDateString(timestamp) {
        const date = new Date(timestamp);

        // Extract the date components
        let month = date.getMonth() + 1; // Months are 0-based
        let day = date.getDate();
        const year = date.getFullYear();

        // Extract time components
        let hours = date.getHours();
        let minutes = date.getMinutes();

        // Determine AM/PM
        const ampm = hours >= 12 ? 'PM' : 'AM';

        // Convert 24-hour format to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12; // Hour '0' should be '12'

        // Ensure two digits for month, day, and minutes
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;
        minutes = minutes < 10 ? '0' + minutes : minutes;

        // Return formatted string
        return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
    }

    get atBottom() {
        return this.parent.scrollTop + this.parent.clientHeight >= this.parent.scrollHeight;
    }
}
