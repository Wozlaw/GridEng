import math
import numpy as np
from Crossection import Sortament, Steel


try:
    from .Crossection import Crossection
    from .Crossection import Material
except ImportError:
    from Crossection import Crossection
    from Crossection import Material

class BeamKnot:
    '''
    Класс, описывающий узел стержня
        Параметры, передаваемые в конструктор класса:
            id - идентификатор узла стержня
            point - точка расположения узла стержня в глобальной системе координат (словарь с ключами x, y, z: float)
            forces - усилия и моменты в узле стержня (словарь с ключами Fx, Fy, Fz, Mx, My, Mz: float)
            base - базисные условия узла стержня, показывающие возможность перемещения (словарь с ключами u, v, w, fix, fiy, fiz: bool)
        Методы класса:
            getForces() - получение усилий и моментов в узле стержня
            setForces(**kwargs) - установка усилий и моментов в узле стержня
            getBase() - получение базисных условий узла стержня
            setBase(**kwargs) - установка базисных условий узла стержня
            setForcesToDef() - установка усилий и моментов в узле стержня в дефолтное состояние (0, 0, 0, 0, 0, 0)
            setBaseToDef() - установка базисных условий узла стержня в дефолтное состояние (False, False, False, False, False, False)
            getPoint() - получение точки расположения узла стержня
            distanceTo(other: BeamKnot) - получение расстояния от узла стержня до другого узла
    '''

    def __init__(self, id, point: dict = None, forces: dict = None, base: dict = None):
        self.id = id
        self.setPointToDef()
        if point is not None:
            self.setPoint(**point)
        self.setForcesToDef()
        if forces is not None:
            self.setForces(**forces)
        self.setBaseToDef()
        if base is not None:
            self.setBase(**base)
    
    def setForcesToDef(self):
        '''
        Установка усилий и моментов в узле стержня в дефолтное состояние (0, 0, 0, 0, 0, 0)
        '''
        self.forces = {'Fx': 0.0, 'Fy': 0.0, 'Fz': 0.0,
                       'Mx': 0.0, 'My': 0.0, 'Mz': 0.0}
        return self

    def setForces(self, **kwargs):
        '''
        Установка усилий и моментов в узле стержня
        Параметры:
            Fx, Fy, Fz, Mx, My, Mz - усилия и моменты в узле стержня
        '''
        self.forces['Fx'] = kwargs.get('Fx', self.forces['Fx'])
        self.forces['Fy'] = kwargs.get('Fy', self.forces['Fy'])
        self.forces['Fz'] = kwargs.get('Fz', self.forces['Fz'])
        self.forces['Mx'] = kwargs.get('Mx', self.forces['Mx'])
        self.forces['My'] = kwargs.get('My', self.forces['My'])
        self.forces['Mz'] = kwargs.get('Mz', self.forces['Mz'])
        return self

    def setBaseToDef(self):
        '''
        Установка базисных условий узла стержня в дефолтное состояние (False, False, False, False, False, False)
        '''
        self.base = {'u': False, 'v': False, 'w': False,
                     'fix': False, 'fiy': False, 'fiz': False}
        return self

    def setBase(self, **kwargs):
        '''
        Установка базисных условий узла стержня
        Параметры:
            u, v, w, fix, fiy, fiz - базисные условия узла стержня
        '''
        self.base['u'] = kwargs.get('u', self.base['u'])
        self.base['v'] = kwargs.get('v', self.base['v'])
        self.base['w'] = kwargs.get('w', self.base['w'])
        self.base['fix'] = kwargs.get('fix', self.base['fix'])
        self.base['fiy'] = kwargs.get('fiy', self.base['fiy'])
        self.base['fiz'] = kwargs.get('fiz', self.base['fiz'])
        return self
    
    def setPointToDef(self):
        '''
        Установка координат узла стержня в дефолтное состояние (0.0, 0.0, 0.0)
        '''
        self.point = {'x': 0.0, 'y': 0.0, 'z': 0.0}
        return self

    def setPoint(self, **kwargs):
        '''
        Установка координат узла стержня
        Параметры:
            x, y, z - координаты узла стержня
        '''
        self.point['x'] = kwargs.get('x', self.point['x'])
        self.point['y'] = kwargs.get('y', self.point['y'])
        self.point['z'] = kwargs.get('z', self.point['z'])
        return self

    def getPoint(self):
        '''
        Получение координат узла стержня
        Возвращаемое значение:
            (x, y, z) - кортеж координат узла стержня
        '''
        return (self.point['x'], self.point['y'], self.point['z'])

    def distanceTo(self, other):
        '''
        Получение расстояния от узла стержня до другого узла
        Параметры:
            other - другой узел стержня
        Возвращаемое значение:
            расстояние от узла стержня до другого узла
        '''
        if isinstance(other, BeamKnot):
            return math.sqrt(sum(map(lambda x: math.pow(x, 2), other - self)))
        else:
            raise TypeError("unsupported operand type")

    def getBaseIndexes(self):
        '''
        Получение индексов базисных условий узла стержня
            Возвращаемое значение: список индексов базисных условий узла стержня
        '''
        indexLst = []
        if  self.base['u']:   indexLst.append(0)
        if  self.base['v']:   indexLst.append(1)
        if  self.base['w']:   indexLst.append(2)
        if  self.base['fix']: indexLst.append(3)
        if  self.base['fiy']: indexLst.append(4)
        if  self.base['fiz']: indexLst.append(5)
        return indexLst
    
    def getForces(self, forceFactor: float = 1.0, momentFactor: float = 1.0):
        '''
        Получение усилий и моментов в узле стержня
            Возвращаемое значение: массив усилий и моментов в узле стержня
        '''
        return np.array([self.forces['Fx'] * forceFactor, self.forces['Fy'] * forceFactor, self.forces['Fz'] * forceFactor, 
                         self.forces['Mx'] * momentFactor, self.forces['My'] * momentFactor, self.forces['Mz'] * momentFactor])

    def __sub__(self, other):
        if isinstance(other, BeamKnot):
            return (self.point['x'] - other.point['x'], self.point['y'] - other.point['y'], self.point['z'] - other.point['z'])
        else:
            raise TypeError("unsupported operand type")

    def __str__(self):
        return f'BeamKnot: {self.id}'

    def __repr__(self):
        return f'<BeamKnot: {self.id}>'


class Beam:
    '''
    Класс стержня
        Параметры, передаваемые в конструктор класса:
            id - идентификатор стержня
            material - материал стержня (объект)
            crossection - поперечное сечение стержня (объект)
            startKnot - идентификатор начальной точки стержня
            endKnot - идентификатор конечной точки стержня
            cacheProps - флаг кеширования свойств стержня (True по умолчанию)
        Свойства:
            id - идентификатор стержня
            material - материал стержня (объект)
            crossection - поперечное сечение стержня (объект)
            knots - идентификаторы узлов стержня (кортеж)
            points - координаты точек стержня (кортеж)
            alpha - угол поворота стержня вокруг своей оси, радиан (0.0 по умолчанию)
            length - длина стержня, мм (кешируется)
            mass - масса стержня, кг (кешируется)
            rotateMatrix - матрица поворота стержня (кешируется)
        Методы:
            getLength() - функция расчета длины стержня, мм
            getMass() - функция расчета массы стержня, кг
            getRotateMatrix() - функция получения матрицы поворота стержня по заданным координатам и углу поворота
            clearCache() - функция очистки кеша
    '''

    def __init__(self, id, material: Material, crossection: Crossection, alpha: float, startKnot: BeamKnot, endKnot: BeamKnot, cacheProps: bool = True, offsetY: float = 0.0, offsetZ: float = 0.0):
        self._cache = {}
        self.cacheProps = cacheProps
        self.id = id
        self.material = material
        self.crossection = crossection
        self.alpha = alpha
        self.startKnot = startKnot
        self.endKnot = endKnot
        # Смещение центра инерции профиля относительно расчетной оси Beam в ЛСК, мм.
        # На текущем этапе смещение считается постоянным по длине элемента:
        # r_i = r_j = [0, offsetY, offsetZ].
        self.offsetY = float(offsetY)
        self.offsetZ = float(offsetZ)

    @property
    def knots(self):
        '''
        Свойство - кортеж идентификаторов узлов стержня
        '''
        return (self.startKnot.id, self.endKnot.id)

    @property
    def points(self):
        '''
        Свойство - кортеж координат точек стержня
        '''
        return (self.startKnot.point, self.endKnot.point)

    @property
    def length(self):
        '''
        Свойство - длина стержня, мм (результат кешируется)
        '''
        length = self._cache.get('length', None)
        if length is None:
            length = self.getLength()
            if self.cacheProps:
                self._cache['length'] = length
        return length

    @property
    def mass(self):
        '''
        Свойство - масса стержня, кг (результат кешируется)
        '''
        mass = self._cache.get('mass', None)
        if mass is None:
            mass = self.getMass()
            if self.cacheProps:
                self._cache['mass'] = mass
        return mass

    @property
    def rotateMatrix(self):
        '''
        Свойство - матрица поворота стержня (результат кешируется)
        '''
        RM = self._cache.get('RM', None)
        if RM is None:
            RM = self.getRotateMatrix()
            if self.cacheProps:
                self._cache['RM'] = RM
        return RM

    @property
    def stiffnessMatrix(self):
        '''
        Матрица жесткости стержня в локальной системе координат (результат кешируется)
        '''
        SM = self._cache.get('SM', None)
        if SM is None:
            SM = self.getStiffnessMatrix()
            if self.cacheProps:
                self._cache['SM'] = SM
        return SM
        
    @property
    def kinematicMatrix(self):
        '''
        Матрица кинематической связи T в ЛСК элемента.

        Связывает перемещения расчетной оси элемента с перемещениями
        центроидной оси профиля: d_centroid = T * d_reference.
        При offsetY = offsetZ = 0 возвращает единичную матрицу I12.
        '''
        KM = self._cache.get('KM', None)
        if KM is None:
            KM = self.getKinematicMatrix()
            if self.cacheProps:
                self._cache['KM'] = KM
        return KM

    @property
    def stiffnessMatrixGCS(self):
        '''
        Матрица жесткости стержня в глобальной системе координат (результат кешируется)
        '''
        SM = self.stiffnessMatrix
        V = np.zeros((12, 12))
        V[0:3, 0:3] = self.rotateMatrix
        V[3:6, 3:6] = self.rotateMatrix
        V[6:9, 6:9] = self.rotateMatrix
        V[9:12, 9:12] = self.rotateMatrix
        return (V.T.dot(SM)).dot(V)


    def getLength(self):
        '''
        Функция расчета длины стержня, мм
        '''
        return self.startKnot.distanceTo(self.endKnot)

    def getMass(self):
        '''
        Функция расчета массы стержня, кг
        '''
        return self.material.rho * (self.crossection.getArea() / 1e6) * (self.length / 1e3)

    def getRotateMatrix(self):
        ''' 
        Функция получения матрицы поворота стержня по заданным координатам вектора и углу поворота оси
        '''
        # Вспомогательные функции для определения косинуса угла между векторами
        def dotproduct(v1, v2): return sum((a*b) for a, b in zip(v1, v2))
        def length(v): return math.sqrt(dotproduct(v, v))
        def cosAngle(v1, v2): return dotproduct(
            v1, v2) / (length(v1) * length(v2))

        def sinFromCos(cos): return math.sqrt(1 - cos ** 2)

        # Основные данные для расчета
        dx, dy, dz = tuple(map(abs, self.endKnot - self.startKnot))
        l = self.length

        # 1. Определяем косинус угла между осью стержня (х0 ЛСК) и осью z, через него находим синус угла, который числено
        # равен координате z в ГСК единичного вектора  r направленного вдоль оси z0 (ЛСК) при отсутствии вращения на угол a
        # вдоль оси x0 (ЛСК)
        cos_x0z = abs(cosAngle([dx, dy, dz], [0, 0, 1]))
        sin_x0z = sinFromCos(cos_x0z)

        # 2. Определяем косинус и синус угла поворота проекции стержня на плоскость {XY} (ГСК) к оси x (ГСК)
        cos_t = 0
        if dx != 0 and dy != 0:
            cos_t = abs(cosAngle([dx, dy, 0], [1, 0, 0]))
        elif dx == 0 and dy == 0:
            cos_t = 1
        elif dx != 0 and dy == 0:
            cos_t = 1
        sin_t = sinFromCos(cos_t)

        if dz > 0:
            if dx >= 0 and dy >= 0:
                cos_t = -cos_t
                sin_t = -sin_t
            elif dx < 0 and dy >= 0:
                sin_t = -sin_t
            elif dx < 0 and dy < 0:
                pass
            elif dx >= 0 and dy < 0:
                cos_t = -cos_t
        else:
            if dx >= 0 and dy >= 0:
                pass
            elif dx < 0 and dy >= 0:
                cos_t = -cos_t
            elif dx < 0 and dy < 0:
                cos_t = -cos_t
                sin_t = -sin_t
            elif dx >= 0 and dy < 0:
                sin_t = -sin_t

        # 3. Матрица поворота стержня без учета вращения вокруг собственной оси x0 (ЛСК)
        V = np.array([[dx / l, dy / l, dz / l], [0, 0, 0],
                     [cos_t * abs(cos_x0z), sin_t * abs(cos_x0z), sin_x0z]])
        V[1] = np.cross(V[2], V[0])

        # 5. Матрица поворота вокруг собственной оси на угол alpha
        V3 = np.array([[1, 0, 0],
                       [0, math.cos(self.alpha), - math.sin(self.alpha)],
                       [0, math.sin(self.alpha), math.cos(self.alpha)]]).T

        return V3.dot(V)

    def getCentroidStiffnessMatrix(self):
        ''' 
        Функция получения матрицы жесткости стержня относительно центроидной оси профиля
        без учета смещения профиля относительно расчетной оси Beam.
            Возвращает:
                Матрицу жесткости стержня в локальной системе координат, 12x12
        '''
        # исходные величины стержня
        self._requireCrossectionAxisYZ()
        csParams = self.crossection.calculateParams()
        S = csParams['A']
        l = self.length
        E = self.material.E
        G = self.material.G
        # момент инерции стержня относительно оси x (момент сопротивления кручению), мм4
        Jx = csParams['Jp']
        Jy = csParams['Jy']  # момент инерции стержня относительно оси y, мм4
        Jz = csParams['Jz']  # момент инерции стержня относительно оси z, мм4

        # конструктор матрицы жесткости
        valR = np.zeros((12, 12))
        val = E * S / l
        valR[0, 0] = val
        valR[6, 0] = -val
        valR[6, 6] = val
        val = 12 * E * Jz / (l ** 3)
        valR[1, 1] = val
        valR[7, 1] = -val
        valR[7, 7] = val
        val = 12 * E * Jy / (l ** 3)
        valR[2, 2] = val
        valR[8, 2] = -val
        valR[8, 8] = val
        val = 6 * E * Jz / (l ** 2)
        valR[5, 1] = val
        valR[11, 1] = val
        valR[7, 5] = -val
        valR[11, 7] = -val
        val = 6 * E * Jy / (l ** 2)
        valR[4, 2] = -val
        valR[10, 2] = -val
        valR[10, 8] = val
        valR[8, 4] = val
        val = G * Jx / l
        valR[3, 3] = val
        valR[9, 3] = -val
        valR[9, 9] = val
        val = 4 * E * Jy / l
        valR[4, 4] = val
        valR[10, 10] = val
        val = 4 * E * Jz / l
        valR[5, 5] = val
        valR[11, 11] = val
        val = 2 * E * Jy / l
        valR[10, 4] = val
        val = 2 * E * Jz / l
        valR[11, 5] = val
        return np.where(valR, valR, valR.T)


    def getKinematicMatrix(self):
        '''
        Функция получения матрицы кинематической связи T для постоянного смещения
        профиля относительно расчетной оси Beam в ЛСК элемента.

        Вектор смещения от расчетной оси к центру инерции профиля:
            r = [0, offsetY, offsetZ], мм.

        Связь степеней свободы:
            d_centroid = T * d_reference,
            u_centroid = u_reference + theta_reference x r,
            theta_centroid = theta_reference.

        Возвращает:
            Матрицу T размером 12x12. При нулевых offsetY и offsetZ
            матрица является единичной.
        '''
        ey = float(self.offsetY)
        ez = float(self.offsetZ)

        Tnode = np.array([
            [1.0, 0.0, 0.0,  0.0,  ez, -ey],
            [0.0, 1.0, 0.0, -ez,  0.0, 0.0],
            [0.0, 0.0, 1.0,  ey,  0.0, 0.0],
            [0.0, 0.0, 0.0,  1.0, 0.0, 0.0],
            [0.0, 0.0, 0.0,  0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0,  0.0, 0.0, 1.0],
        ], dtype=float)

        T = np.zeros((12, 12), dtype=float)
        T[0:6, 0:6] = Tnode
        T[6:12, 6:12] = Tnode
        return T


    def getStiffnessMatrix(self):
        ''' 
        Функция получения матрицы жесткости стержня в ЛСК относительно расчетной оси Beam
        с учетом смещения профиля offsetY/offsetZ.

        Сначала строится матрица жесткости по центроидной оси профиля Kc, затем она
        приводится к расчетной оси через матрицу кинематической связи T:
            Kref = T.T * Kc * T.

        При offsetY = offsetZ = 0 матрица T является единичной и результат совпадает
        с матрицей жесткости по центроидной оси.
            Возвращает:
                Матрицу жесткости стержня в локальной системе координат, 12x12
        '''
        Kc = self.getCentroidStiffnessMatrix()
        T = self.kinematicMatrix
        return (T.T.dot(Kc)).dot(T)


    def _normalizeVector(self, vector, name='vector'):
        """
        Нормализация трехмерного вектора.
        """
        v = np.array(vector, dtype=float)

        if v.shape != (3,):
            raise ValueError(f'{name} должен быть трехмерным вектором [x, y, z]')

        norm = np.linalg.norm(v)
        if norm == 0:
            raise ValueError(f'{name} не должен быть нулевым вектором')

        return v / norm


    def _requireCrossectionAxisYZ(self):
        """
        Проверка, что сечение стержня задано в плоскости YZ.

        Для Beam локальная ось X является продольной осью стержня,
        поэтому поперечное сечение должно иметь axis='YZ'.
        """
        if self.crossection.axis != 'YZ':
            raise ValueError(
                "Для Beam поперечное сечение должно иметь axis='YZ', "
                "так как локальная ось X является продольной осью стержня"
            )


    def getWindDirectionLCS(self, windDirection=(1.0, 0.0, 0.0)):
        """
        Перевод направления ветра из глобальной системы координат в локальную
        систему координат стержня.

        windDirection:
            Единичный или произвольный ненулевой вектор направления ветра в ГСК.

        Возвращает:
            Единичный вектор направления ветра в ЛСК стержня [x, y, z].
        """
        wind = self._normalizeVector(windDirection, name='windDirection')
        return self.rotateMatrix.dot(wind)


    def getWindDirectionCrossection(self, windDirection=(1.0, 0.0, 0.0)):
        """
        Получение направления ветра в плоскости поперечного сечения Beam.

        Для Beam поддерживается только crossection.axis='YZ'.

        Возвращает:
            Двухмерный вектор [wind_y, wind_z] в локальной плоскости YZ.
        """
        self._requireCrossectionAxisYZ()

        wind_lcs = self.getWindDirectionLCS(windDirection)
        return np.array([wind_lcs[1], wind_lcs[2]], dtype=float)


    def getWindProjectionFactor(self, windDirection=(1.0, 0.0, 0.0)):
        """
        Расчет коэффициента проекции длины стержня на плоскость,
        перпендикулярную направлению ветра.

        Возвращает:
            sin(alpha), где alpha - угол между локальной осью X стержня
            и направлением ветра.
        """
        wind_cs = self.getWindDirectionCrossection(windDirection)
        return float(np.linalg.norm(wind_cs))


    def getEffectiveWindWidth(self, windDirection=(1.0, 0.0, 0.0)):
        """
        Расчет эффективной ширины поперечного сечения стержня, мм.
        """
        wind_cs = self.getWindDirectionCrossection(windDirection)

        if np.linalg.norm(wind_cs) == 0:
            return 0.0

        return self.crossection.getProjectionWidth(wind_cs)


    def getEffectiveWindArea(self, windDirection=(1.0, 0.0, 0.0)):
        """
        Расчет эффективной ветровой площади стержня, мм2.

        A_eff = L * sin(alpha) * b_eff

        где:
            L - длина стержня, мм;
            sin(alpha) - коэффициент проекции длины стержня;
            b_eff - эффективная ширина сечения, мм.
        """
        projection_factor = self.getWindProjectionFactor(windDirection)

        if projection_factor == 0:
            return 0.0

        width = self.getEffectiveWindWidth(windDirection)
        return float(self.length * projection_factor * width)

    def clearCache(self):
        '''
        Функция очистки кеша
        '''
        self._cache = {}
        return self

    def __str__(self):
        return f'Beam: {self.id}'

    def __repr__(self):
        return f'<Beam: {self.id}>'
    

class BeamSystem3D:
    def __init__(self, df, alphaInRad=False, cacheProps=True, **kwargs):
        self._cache = {}
        self.cacheProps = cacheProps
        self.beams = []
        self.knots = []
        self.crossections = []
        self.materials = []
        self.conditions = df.get('conditions', {'Tr': 20, 'Tb': 20})
        self.momentFactor = kwargs.get('momentFactor', 1000.0)
        self.forceFactor = kwargs.get('forceFactor', 1.0)

        for item in df.get('knots', []):
            self.knots.append(BeamKnot(**item))
        for item in df.get('beams', []):
            id = item['id']
            material = self.getMaterial(item['material'])
            
            if material is None:
                #raise Exception('Материал не задан или не найден!')
            
                material = Steel.getSteel(item['material'])
                self.materials.append(material)
            
            crossection = self.getCrossection(item['crossection'])
            
            if crossection is None:
                #raise Exception('Поперечное сечение не задано или не найдено!')
            
                crossection = Sortament.getSortament(
                    item['crossection'], cacheProps=cacheProps)
                crossection.setAxis('YZ')
                self.crossections.append(crossection)
            
            alpha = 0.0
            if alphaInRad:
                alpha = item['alpha']
            else:
                alpha = math.radians(item['alpha'])
            startKnot = self.getKnotById(item['knots'][0])
            endKnot = self.getKnotById(item['knots'][1])

            self.beams.append(Beam(id=id, alpha=alpha, crossection=crossection,
                              material=material, startKnot=startKnot, endKnot=endKnot,
                              offsetY=item.get('offsetY', 0.0), offsetZ=item.get('offsetZ', 0.0),
                              cacheProps=cacheProps))

    @property
    def nBeams(self):
        return len(self.beams)

    @property
    def nKnots(self):
        return len(self.knots)

    def assignBoundaryCondition(self, A: np.array, i: int):
        ''' 
        Функция, определяющая граничные условия
            Аргументы:
                A - матрица жесткости
                i - номер строки/столбца, где необходимо задать граничное условие
        Возвращает:
            A - матрица жесткости с заданным граничным условием
        '''
        retA = A.copy()
        retA[i, :] = 0
        retA[:, i] = 0
        retA[i, i] = 1
        return retA

    def getCrossection(self, name: str) -> Crossection:
        try:
            return next(filter(lambda x: x.name == name, self.crossections))
        except StopIteration:
            return None

    def getMaterial(self, name: str) -> Steel:
        try:
            return next(filter(lambda x: x.name == name, self.materials))
        except StopIteration:
            return None

    def getKnotById(self, id):
        '''
        Получить узел по его идентификатору
            Параметры:
                id - идентификатор узла
            Возвращает:
                Узел по его идентификатору
        '''
        try:
            return next(filter(lambda x: x.id == id, self.knots))
        except StopIteration:
            raise Exception(f'Не найден узел с id = {id}')

    def getBeamById(self, id):
        '''
        Получить балку по ее идентификатору
            Параметры:
                id - идентификатор балки
            Возвращает:
                Балка по ее идентификатору
        '''
        try:
            return next(filter(lambda x: x.id == id, self.beams))
        except StopIteration:
            raise Exception(f'Не найдена балка с id = {id}')

    def getKnotIdex(self, id):
        '''
        Получить индекс узла по его идентификатору
            Параметры:
                id - идентификатор узла
            Возвращает:
                Индекс узла по его идентификатору
        '''
        try:
            return next((i for i, knot in enumerate(self.knots) if knot.id == id), None)
        except StopIteration:
            raise Exception(f'Не найден узел с id = {id}')

    def getBeamIdex(self, id):
        '''
        Получить индекс балки по ее идентификатору
            Параметры:
                id - идентификатор балки
            Возвращает:
                Индекс балки по ее идентификатору
        '''
        try:
            return next((i for i, beam in enumerate(self.beams) if beam.id == id), None)
        except StopIteration:
            raise Exception(f'Не найдена балка с id = {id}')

    def getAGCS(self):
        ''' 
        Функция определения матрицы жесткости конструкции в общей системе координат (GCS)
        '''
        A = np.zeros((self.nKnots * 6, self.nKnots * 6))
        for beam in self.beams:
            tempA = np.zeros((self.nKnots * 6, self.nKnots * 6))
            R = beam.stiffnessMatrixGCS
            knoti = self.knots.index(beam.startKnot) * 6
            knotj = self.knots.index(beam.endKnot) * 6
            tempA[knoti:knoti + 6, knoti:knoti + 6] = R[0:6, 0:6]  # ii
            tempA[knotj:knotj + 6, knotj:knotj + 6] = R[6:12, 6:12]  # jj
            tempA[knoti:knoti + 6, knotj:knotj + 6] = R[0:6, 6:12]  # ij
            tempA[knotj:knotj + 6, knoti:knoti + 6] = R[6:12, 0:6]  # ji
            A += tempA
        for i, Knot in enumerate(self.knots):
            for val in Knot.getBaseIndexes():
                A = self.assignBoundaryCondition(A, i * 6 + val)
        return A

    @property
    def AGCS(self):
        ''' 
        Матрица жесткости конструкции в общей системе координат (GCS) (результат кешируется)
        '''
        A = self._cache.get('AGCS', None)
        if A is None:
            A = self.getAGCS()
            if self.cacheProps:
                self._cache['AGCS'] = A
        return A

    def getP(self):
        ''' 
        Функция определения массива с заданными силами и моментами в узлах конструкции (GCS)
            Возвращает:
                Массив с силами и моментами в узлах конструкции
        '''
        return np.array([Knot.getForces(self.forceFactor, self.momentFactor) for Knot in self.knots])

    @property
    def P(self):
        ''' 
        Массив с заданными силами и моментами в узлах конструкции (GCS), (результат кешируется)
        '''
        P = self._cache.get('P', None)
        if P is None:
            P = self.getP()
            if self.cacheProps:
                self._cache['P'] = P
        return P

    def getUGCS(self):
        ''' 
        Функция определения узловых перемещений в общей системе координат (GCS)
            Возвращает:
                Матрицу перемещений в общей системе координат (GCS)
        '''
        U = np.linalg.solve(self.AGCS, np.hstack(
            self.P))  # + np.hstack(self.Ft) + np.hstack(self.G)) суммарные силы нужно определять в узлах, а не на концах балок!!! TODO
        return U.reshape(self.nKnots, 6)

    @property
    def UGCS(self):
        ''' 
        Матрица перемещений в общей системе координат (GCS) (результат кешируется)

        '''
        U = self._cache.get('UGCS', None)
        if U is None:
            U = self.getUGCS()
            if self.cacheProps:
                self._cache['UGCS'] = U
        return U

    def getF(self):
        '''
        Функция определения усилий на концах стержней в местной системе координат    
        Возвращает:
            Матрицу усилий на концах стержней в местной системе координат
        '''
        UGCS = self.UGCS
        F = []
        for beam in self.beams:
            knoti = self.getKnotIdex(beam.startKnot.id)
            knotj = self.getKnotIdex(beam.endKnot.id)
            zk = (np.hstack(np.array([UGCS[knoti], UGCS[knotj]])))
            V = np.zeros((12, 12))
            V[0:3, 0:3] = beam.rotateMatrix
            V[3:6, 3:6] = beam.rotateMatrix
            V[6:9, 6:9] = beam.rotateMatrix
            V[9:12, 9:12] = beam.rotateMatrix
            # Перемещения узлов расчетной оси переводятся из ГСК в ЛСК.
            # beam.stiffnessMatrix уже приведена к расчетной оси с учетом offsetY/offsetZ:
            # Kref = T.T * Kcentroid * T. Поэтому результат ниже - усилия на концах
            # стержня в ЛСК относительно расчетной оси элемента.
            z_lcs_ref = V.dot(zk)
            F.append(beam.stiffnessMatrix.dot(z_lcs_ref))
        return F

    @property
    def F(self):
        '''
            Матрица усилий на концах стержней в местной системе координат, (результат кешируется)
        '''
        F = self._cache.get('F', None)
        if F is None:
            F = self.getF()
            if self.cacheProps:
                self._cache['F'] = F
        return F

    def getFDict(self, tol=None):
        '''
            Словарь усилий на концах стержней в локальной системе координат
        '''
        F = []
        keys = ['Fx', 'Fy', 'Fz', 'Mx', 'My', 'Mz']
        k = [1 / self.forceFactor, 1 / self.forceFactor, 1 / self.forceFactor, 1 / self.momentFactor, 1 / self.momentFactor, 1 / self.momentFactor]
        for values in self.F:
            startForces = values[0:6] * k
            endForces = values[6:12] * k
            if tol is not None:
                startForces = np.round(startForces, tol)
                endForces = np.round(endForces, tol)
            F.append([dict(zip(keys, startForces.astype(type('float', (float,), {})))), dict(
                zip(keys, endForces.astype(type('float', (float,), {}))))])
        return F

    def getFCentroidDict(self, tol=None):
        '''
        Словарь усилий на концах стержней в локальной системе координат,
        приведенных к центральной оси профиля.

        getFDict() возвращает усилия относительно расчетной оси элемента.
        Для проверки напряжений в сечении нужны усилия относительно
        центральной оси профиля.

        Связь:
            F_ref = T.T * F_centroid

        Отсюда:
            F_centroid = solve(T.T, F_ref)
        '''
        F = []
        keys = ['Fx', 'Fy', 'Fz', 'Mx', 'My', 'Mz']
        k = [
            1 / self.forceFactor,
            1 / self.forceFactor,
            1 / self.forceFactor,
            1 / self.momentFactor,
            1 / self.momentFactor,
            1 / self.momentFactor,
        ]

        for i, values_ref in enumerate(self.F):
            beam = self.beams[i]

            # values_ref - усилия относительно расчетной оси элемента.
            # Переводим их к центральной оси профиля.
            values_centroid = np.linalg.solve(beam.kinematicMatrix.T, values_ref)

            startForces = values_centroid[0:6] * k
            endForces = values_centroid[6:12] * k

            if tol is not None:
                startForces = np.round(startForces, tol)
                endForces = np.round(endForces, tol)

            F.append([
                dict(zip(keys, startForces.astype(type('float', (float,), {})))),
                dict(zip(keys, endForces.astype(type('float', (float,), {}))))
            ])

        return F


    def getKnotF(self):
        '''
        Функция определения узловых усилий в общей системе координат (GCS)
        Возвращает:
            Матрицу узловых усилий в общей системе координат (GCS)
        '''
        F = self.F
        retF = np.zeros([self.nKnots, 6])
        for i, beam in enumerate(self.beams):
            V = np.zeros((12, 12))
            V[0:3, 0:3] = beam.rotateMatrix
            V[3:6, 3:6] = beam.rotateMatrix
            V[6:9, 6:9] = beam.rotateMatrix
            V[9:12, 9:12] = beam.rotateMatrix
            beamFGCS = V.T.dot(F[i])
            knoti = self.getKnotIdex(beam.startKnot.id)
            knotj = self.getKnotIdex(beam.endKnot.id)
            retF[knoti] += beamFGCS[0:6]
            retF[knotj] += beamFGCS[6:12]
        return retF

    @property
    def KnotF(self):
        '''
            Матрица узловых усилий в общей системе координат (GCS), (результат кешируется)
        '''
        KnotF = self._cache.get('KnotF', None)
        if KnotF is None:
            KnotF = self.getKnotF()
            if self.cacheProps:
                self._cache['KnotF'] = KnotF
        return KnotF

    def getKnotFDict(self, tol=None):
        '''
            Словарь узловых усилий на концах стержней в общей системе координат, (GCS)
        '''
        F = []
        keys = ['Fx', 'Fy', 'Fz', 'Mx', 'My', 'Mz']
        k = [1 / self.forceFactor, 1 / self.forceFactor, 1 / self.forceFactor, 1 / self.momentFactor, 1 / self.momentFactor, 1 / self.momentFactor]
        for values in self.KnotF:
            if tol is None:
                F.append(
                    dict(zip(keys, k * values.astype(type('float', (float,), {})))))
            else:
                F.append(
                    dict(zip(keys, np.round(k * values, tol).astype(type('float', (float,), {})))))
        return F


    def calculateTensions(self, theory=3,tol=None):
        ''' 
        Получение главных напряжений
            Параметры:
                theory - Теория расчета касательных напряжений (по умолчанию 3 - теория наибольших касательных напряжений)
                    так же имплементированы:
                    - первая (1) теория - теория наибольших нормальных напряжений
                    - четвертая (4) теория - энергетическая

            Возвращает: список значений опасных напряжения для балок, МПа
        '''
        # getF() returns element end forces in LCS relative to the reference axis.
        # These forces are used for structural equilibrium/reactions.

        # calculateTensions() must use forces transformed to the section centroid axes,
        # because Crossection.calculateTensions() expects section forces relative
        # to the centroidal axes of the cross-section.

        tensions = []
        F = self.getFCentroidDict()
        for i, beam in enumerate(self.beams):
            T = max(beam.crossection.calculateTensions(
                F[i][0], theory), beam.crossection.calculateTensions(F[i][1], theory))
            if tol is None:
                tensions.append(T)
            else:
                tensions.append(round(T, tol))
        return tensions
        

    def clearCache(self):
        ''' 
        Очистка кэша
        '''
        self._cache = {}
        for beam in self.beams:
            beam.clearCache()
        for crossection in self.crossections:
            crossection.clearCache()

    def __str__(self):
        return f'BeamSystem3D | beams: {self.nBeams} | knots: {self.nKnots}'

    def __repr__(self):
        return f'<BeamSystem3D | beams: {self.nBeams} | knots: {self.nKnots}>'



