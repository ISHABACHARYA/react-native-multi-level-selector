import React, {Component} from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableHighlight,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import DropDownItem from './DropDownItem';
import DisplayFilter from './DisplayFilter';

const deepClone = arr => JSON.parse(JSON.stringify(arr));

export class DropDown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      options: props.options,
      optionStack: [],
      levelDown: false,
      selected: [],
      animation: {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(20),
      },
    };
  }

  toggleOpen = () => {
    this.setState(prevState => {
      if (!prevState.isOpen) {
        Animated.parallel([
          Animated.timing(this.state.animation.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(this.state.animation.translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(this.state.animation.opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(this.state.animation.translateY, {
            toValue: 20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
      return {
        isOpen: !prevState.isOpen,
      };
    });
  };

  handleSelect = id => {
    const _options = deepClone(this.props.options);
    let _selected = deepClone(this.state.selected);

    const filterSelections = (selected, newSelection) => {
      const index = selected.findIndex(el => {
        if (newSelection) return el.id === newSelection.id;
        else {
          return el.id === id.slice(0, 1);
        }
      });
      if (index === -1) return selected.concat(newSelection);
      else {
        selected.splice(index, 1, newSelection).filter(el => el);
        return selected.filter(el => el);
      }
    };

    const selectOption = (arr, sArr, i) => {
      const parent = arr.find(el => el.id === id.slice(0, i + 1));
      let sParent = [];
      if (
        sArr &&
        sArr.length &&
        sArr.some(el => el.id.slice(0, 1) === id.slice(0, 1))
      ) {
        sParent = sArr.find(el => el.id === id.slice(0, i + 1));
        if (sParent === undefined) {
          sParent = [];
          if (parent.id === id) {
            return sArr.concat(parent);
          }
        } else if (sParent.id === id) {
          return sArr.filter(el => el.id !== sParent.id);
        }
      }

      if (parent.id === id) return [parent];

      if (parent.nested) {
        const nested = selectOption(parent.nested, sParent.nested, (i += 2));
        if (Array.isArray(nested)) {
          if (nested.length) {
            parent['nested'] = nested;
          } else return null;
        } else if (nested === null) {
          sParent['nested'] = sParent.nested.filter(
            el => el.id !== id.slice(0, i + 1),
          );
          return sParent['nested'].length ? sParent : null;
        } else {
          parent['nested'] = sParent.nested
            ? filterSelections(sParent.nested, nested)
            : [nested];
        }
      }

      return parent;
    };

    const newSelection = selectOption(_options, _selected, 0);
    _selected = filterSelections(_selected, newSelection);

    this.setState({
      selected: _selected,
    });

    if (this.props.onChange) {
      this.props.onChange(_selected);
    }

    return _selected;
  };

  removeFilter = id => {
    this.setState(prevState => ({
      selected: prevState.selected.filter(el => el.id !== id),
    }));
  };

  loadNested = options => {
    this.setState(prevState => ({
      optionStack: prevState.optionStack.concat([prevState.options]),
      options,
      levelDown: true,
    }));
  };

  goBack = () => {
    this.setState(prevState => ({
      options: prevState.optionStack.pop(),
      levelDown: !!prevState.optionStack.length,
    }));
  };

  render() {
    const {options, isOpen, levelDown, selected, animation} = this.state;

    return (
      <View style={{padding: 10}}>
        <TouchableHighlight
          underlayColor={this.props.inputUnderlayColor || '#fff'}
          onPress={this.toggleOpen}
          style={[styles.rootSelect, this.props.inputStyles]}>
          <>
            {!selected.length ? (
              <Text
                style={{color: 'gray', padding: 5, margin: 3, fontSize: 23}}>
                {this.props.placeholder || 'Multi Level Selector'}
              </Text>
            ) : (
              <DisplayFilter
                removeFilter={this.removeFilter}
                filters={selected}
              />
            )}
          </>
        </TouchableHighlight>

        <Animated.View
          pointerEvents={!isOpen ? 'none' : 'auto'}
          style={[
            styles.optionContainer,
            {
              opacity: animation.opacity,
              transform: [
                {
                  translateY: animation.translateY,
                },
              ],
            },
            this.props.optionContainerStyles,
          ]}>
          {levelDown && (
            <TouchableHighlight
              onPress={this.goBack}
              underlayColor="#fff"
              style={[
                styles.optionTextWrapper,
                this.props.optionTextWrapperStyles,
              ]}>
              <>
                <Icon
                  style={this.props.optionsIconStyles}
                  name="chevron-left"
                />
                <Text style={[this.props.optionTextStyles]}>Go Back</Text>
              </>
            </TouchableHighlight>
          )}

          {options.map(el => (
            <DropDownItem
              handleSelect={this.handleSelect}
              key={el.id}
              option={el}
              nested={el.nested}
              selected={selected}
              loadNested={el.nested && this.loadNested}
              optionTextWrapperStyles={this.props.optionTextWrapperStyles}
              optionTextStyles={this.props.optionTextStyles}
              optionsIconStyles={this.props.optionsIconStyles}
            />
          ))}
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  rootSelect: {
    borderRadius: 5,
    elevation: 5,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 5,
    position: 'relative',
    top: 10,
  },
  optionTextWrapper: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default DropDown;
