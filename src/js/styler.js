import formats from './formats';

class styler {

  constructor(editor, {
    commands = ['bold', 'italic', 'underline']
  } = {}) {
    this.editor = editor;
    this.options = {
      commands
    };
    this.init();
  }

  /**
   * Create button HTML element
   * @param {String} name 
   */
  static button(name) {
    const button = document.createElement('button');
    button.classList.add('styler-button');
    button.id = name;
    button.insertAdjacentHTML('afterbegin', `
      <svg class="icon">
        <use xlink:href="dist/svg/symbols.svg#icon-${name}"></use>
      </svg>
    `);
    return button;
  }

  /**
   * Create select options HTML element
   * @param {String} name 
   * @param {Object} options 
   */
  static select(name, options) {
    const select = document.createElement('select');
    select.classList.add('styler-select');
    select.id = name;
    options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.innerText = option.text;
      select.appendChild(optionElement);
    })
    return select;
  }

  /**
   * Create input HTML element
   * @param {String} name 
   * @param {String} type 
   */
  static input(name, type) {
    const input = document.createElement('input');
    input.classList.add(`styler-${name}`);
    input.id = name;
    input.type = type;
    return input;
  }

  /**
   * Create the styler toolbar
   */
  init() {
    this.container = document.createElement('ul');
    this.container.classList.add('styler');
    this.style = {};
    this.inits = {};
    document.body.insertBefore(this.container, this.editor.el);

    this.options.commands.forEach((el) => {
      const li = document.createElement('li');
      const current = formats[el];
      if (!current) {
        console.warn(el + ' is not found');
        return;
      }

      switch (current.element) {
        case 'button':
          this.style[el] = styler.button(el);
          // some buttons don't have commands
          // instead it use functions form editor class
          // here we detecte which callback should be use
          const callBack =
            current.command ?
            this.execute.bind(this) :
            this.editor[current.func].bind(this.editor);
          
          this.style[el].addEventListener('click', () => {
            callBack(current.command, current.value);
          });
          li.appendChild(this.style[el]);
          break;

        case 'select':
          this.style[el] = styler.select(el, current.options);
          this.style[el].addEventListener('change', () => {
            const selection = this.style[el];
            this.execute(current.command, selection[selection.selectedIndex].value);
          });
          li.appendChild(this.style[el]);
          break;
        
        case 'input': 
          this.style[el] = styler.input(el, current.type);
          this.style[el].addEventListener('change', () => {
            this.editor.el.focus();
            this.execute(current.command, this.style[el].value);
          });
          li.appendChild(this.style[el]);
          break;
          
        case 'styling': 
          li.classList.add(current.class);
          break;

        case 'custom':
          const markup = current.create();
          li.appendChild(markup);
          break;

        default:
          console.warn(el + ' is not found');
          return; 
      }

      if (current.init) {
        this.inits[el] = new current.init(this.style[el], current.initConfig);
      }

      this.container.appendChild(li);
    })
  }

  /**
   * Execute command for the selected button
   * @param {String} cmd 
   * @param {String|Number} value 
   */
  execute(cmd, value) {
    if (this.editor.HTML) return;
    document.execCommand(cmd, false, value);
    this.editor.el.focus();
    this.updateStylerStates();
  }

  /**
   * Update the state of the active style
   */
  updateStylerStates() {
    Object.keys(this.style).forEach((styl) => {
      if (document.queryCommandState(styl)) {
        this.style[styl].classList.add('is-active');
        return;
      }
      if (document.queryCommandValue('formatBlock') === styl) {
        this.style[styl].classList.add('is-active');
        return;
      }
      if (document.queryCommandValue(styl) && document.queryCommandValue(styl) !== 'false') {
        this.style[styl].value = document.queryCommandValue(styl);
        return;
      }
      if (styl === 'color') {
        this.inits[styl].selectColor(document.queryCommandValue('foreColor'), true);
        return;
      }
      this.style[styl].classList.remove('is-active');
    })
  }
}

export default styler;